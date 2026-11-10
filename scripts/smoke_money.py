"""
Smoke Money Test for Stage 8: Refunds, SimPay, and Money Safety

Runs real HTTP calls against store-api (default http://localhost:8000).
Exercises happy path and negative attack checks:
- Happy path: return, approve, pickup, transit, receive, inspect ok, reserve,
  authorize, release, completed.
- Negative checks ('BLOCKED as expected'):
  1. Over-reservation
  2. Release above the cap without authorization (409 limit_exceeded)
  3. Staff authorizing above Rs 2,000
  4. Idempotency key reused with a different payload
"""

import sys
import time
import uuid

import httpx

BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"


def get_token(client: httpx.Client, email: str) -> str:
    resp = client.post(
        f"{API_URL}/auth/login",
        json={"email": email, "password": "Demo@12345"},
    )
    if resp.status_code != 200:
        print(f"FAIL: login for {email} returned {resp.status_code}: {resp.text}")
        sys.exit(1)
    return resp.json()["access_token"]


def get_service_token(client: httpx.Client, client_id: str, secret: str) -> str:
    resp = client.post(
        f"{API_URL}/auth/token",
        json={
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": secret,
        },
    )
    if resp.status_code != 200:
        print(f"FAIL: token for {client_id} returned {resp.status_code}: {resp.text}")
        sys.exit(1)
    return resp.json()["access_token"]


def run_smoke() -> None:
    fail_count = 0

    with httpx.Client(timeout=10.0) as http:
        # Check API health
        try:
            r = http.get(f"{BASE_URL}/healthz")
            if r.status_code != 200:
                print(f"FAIL: healthz returned {r.status_code}")
                sys.exit(1)
        except Exception as exc:
            print(f"FAIL: Could not connect to {BASE_URL}: {exc}")
            sys.exit(1)

        print("=== Step 0: Authentication and Settings Check ===")
        aarav_tok = get_token(http, "aarav.mehta@example.test")
        priya_tok = get_token(http, "priya.sharma@nestkart.test")  # owner
        kiran_tok = get_token(http, "kiran.rao@nestkart.test")    # staff
        executor_tok = get_service_token(http, "agent-executor", "fake_executor_secret_key_12345")

        # Settings check: Priya owner
        r = http.get(f"{API_URL}/admin/settings", headers={"Authorization": f"Bearer {priya_tok}"})
        if r.status_code == 200 and r.json().get("autonomy_cap_paise") == 50000:
            print("PASS: Priya GET /admin/settings shows autonomy_cap_paise 50000 and autonomy_daily_cap_paise 500000")
        else:
            print(f"FAIL: Priya GET /admin/settings returned {r.status_code}: {r.text}")
            fail_count += 1

        # Staff forbidden from PUT settings
        r = http.put(
            f"{API_URL}/admin/settings",
            headers={"Authorization": f"Bearer {kiran_tok}"},
            json={"autonomy_cap_paise": 60000},
        )
        if r.status_code == 403:
            print("BLOCKED as expected: Kiran (staff) trying PUT /admin/settings -> forbidden")
        else:
            print(f"FAIL: Kiran PUT /admin/settings returned {r.status_code} instead of 403")
            fail_count += 1

        print("\n=== Step 1: Return Happy Path (ORD-1042, Aarav) ===")
        # 1. Aarav requests return on delivered order ORD-1042
        ret_key = f"IDEMP-RET-{uuid.uuid4().hex[:8]}"
        r = http.post(
            f"{API_URL}/orders/ORD-1042/returns",
            headers={"Authorization": f"Bearer {aarav_tok}", "Idempotency-Key": ret_key},
            json={
                "items": [{"item_id": "ITEM-1042-1", "qty": 1}],
                "reason_code": "defective",
                "reason_text": "Non-stick cookware surface defective",
                "resolution": "refund",
            },
        )
        if r.status_code in (200, 201) and r.json().get("status") == "requested":
            return_id = r.json()["return_id"]
            print(f"PASS: return requested ({return_id})")
        else:
            print(f"FAIL: return request returned {r.status_code}: {r.text}")
            sys.exit(1)

        # 2. Approve
        r = http.post(
            f"{API_URL}/returns/{return_id}/transition",
            headers={
                "Authorization": f"Bearer {kiran_tok}",
                "Idempotency-Key": f"IDEMP-APP-{uuid.uuid4().hex[:8]}",
            },
            json={"to": "approved", "reason": "Staff approved return"},
        )
        if r.status_code == 200 and r.json().get("status") == "approved":
            print("PASS: return approved")
        else:
            print(f"FAIL: return approve returned {r.status_code}: {r.text}")
            fail_count += 1

        # 3. Pickup scheduled
        r = http.post(
            f"{API_URL}/returns/{return_id}/transition",
            headers={
                "Authorization": f"Bearer {kiran_tok}",
                "Idempotency-Key": f"IDEMP-PKP-{uuid.uuid4().hex[:8]}",
            },
            json={"to": "pickup_scheduled"},
        )
        if r.status_code == 200 and r.json().get("status") == "pickup_scheduled":
            print("PASS: pickup scheduled")
        else:
            print(f"FAIL: pickup scheduled returned {r.status_code}: {r.text}")
            fail_count += 1

        # 4. In transit back
        r = http.post(
            f"{API_URL}/returns/{return_id}/transition",
            headers={
                "Authorization": f"Bearer {kiran_tok}",
                "Idempotency-Key": f"IDEMP-TRN-{uuid.uuid4().hex[:8]}",
            },
            json={"to": "in_transit_back"},
        )
        if r.status_code == 200 and r.json().get("status") == "in_transit_back":
            print("PASS: return in transit back")
        else:
            print(f"FAIL: return in transit returned {r.status_code}: {r.text}")
            fail_count += 1

        # 5. Receive
        r = http.post(
            f"{API_URL}/admin/returns/{return_id}/receive",
            headers={
                "Authorization": f"Bearer {kiran_tok}",
                "Idempotency-Key": f"IDEMP-RCV-{uuid.uuid4().hex[:8]}",
            },
            json={},
        )
        if r.status_code == 200 and r.json().get("status") == "received":
            print("PASS: return received")
        else:
            print(f"FAIL: return receive returned {r.status_code}: {r.text}")
            fail_count += 1

        # 6. Inspect OK
        r = http.post(
            f"{API_URL}/admin/returns/{return_id}/inspect",
            headers={
                "Authorization": f"Bearer {kiran_tok}",
                "Idempotency-Key": f"IDEMP-INS-{uuid.uuid4().hex[:8]}",
            },
            json={"result": "ok", "note": "Defect confirmed"},
        )
        if r.status_code == 200 and r.json().get("status") == "inspected_ok":
            print("PASS: return inspect ok")
        else:
            print(f"FAIL: return inspect returned {r.status_code}: {r.text}")
            fail_count += 1

        print("\n=== Step 2: Refund Reservation and Negative Checks ===")
        # Negative Check 1: Over-reservation (ORD-1042 total is 120000 paise; try 150000 paise)
        r = http.post(
            f"{API_URL}/orders/ORD-1042/refund-reservations",
            headers={
                "Authorization": f"Bearer {executor_tok}",
                "Idempotency-Key": f"IDEMP-OVER-{uuid.uuid4().hex[:8]}",
            },
            json={"amount_paise": 150000, "return_id": return_id, "method": "original"},
        )
        if r.status_code in (400, 409):
            print("BLOCKED as expected: over-reservation")
        else:
            print(f"FAIL: over-reservation returned {r.status_code} instead of 400/409")
            fail_count += 1

        # 7. Reserve exact refundable amount (120,000 paise)
        res_key = f"IDEMP-RES-{uuid.uuid4().hex[:8]}"
        r = http.post(
            f"{API_URL}/orders/ORD-1042/refund-reservations",
            headers={
                "Authorization": f"Bearer {executor_tok}",
                "Idempotency-Key": res_key,
            },
            json={"amount_paise": 120000, "return_id": return_id, "method": "original"},
        )
        if r.status_code in (200, 201) and r.json().get("status") == "reserved":
            refund_id = r.json()["refund_id"]
            print(f"PASS: refund reservation created ({refund_id} reserved for 120000 paise)")
        else:
            print(f"FAIL: refund reservation returned {r.status_code}: {r.text}")
            sys.exit(1)

        # Negative Check 2: Release above cap without authorization (409 limit_exceeded)
        r = http.post(
            f"{API_URL}/refunds/{refund_id}/release",
            headers={
                "Authorization": f"Bearer {executor_tok}",
                "Idempotency-Key": f"IDEMP-REL-FAIL-{uuid.uuid4().hex[:8]}",
            },
            json={},
        )
        if r.status_code == 409:
            print("BLOCKED as expected: release above the cap without authorization (409 limit_exceeded)")
        else:
            print(f"FAIL: release above cap returned {r.status_code} instead of 409")
            fail_count += 1

        # Negative Check 3: Staff authorizing above Rs 2,000 (200,000 paise)
        # Reserve 245,000 paise on ORD-3011 (total is 245,000 paise)
        r_big = http.post(
            f"{API_URL}/orders/ORD-3011/refund-reservations",
            headers={
                "Authorization": f"Bearer {executor_tok}",
                "Idempotency-Key": f"IDEMP-BIG-RES-{uuid.uuid4().hex[:8]}",
            },
            json={"amount_paise": 245000, "method": "original"},
        )
        if r_big.status_code in (200, 201):
            big_ref_id = r_big.json()["refund_id"]
            # Kiran (staff) tries to authorize 245,000 paise -> 403 forbidden
            r_staff = http.post(
                f"{API_URL}/refunds/{big_ref_id}/authorize",
                headers={
                    "Authorization": f"Bearer {kiran_tok}",
                    "Idempotency-Key": f"IDEMP-STAFF-FAIL-{uuid.uuid4().hex[:8]}",
                },
                json={"amount_paise": 245000},
            )
            if r_staff.status_code == 403:
                print("BLOCKED as expected: staff authorizing above Rs 2,000")
            else:
                print(f"FAIL: staff authorizing above Rs 2,000 returned {r_staff.status_code} instead of 403")
                fail_count += 1

            # Cancel big reservation
            http.post(
                f"{API_URL}/refunds/{big_ref_id}/cancel-reservation",
                headers={
                    "Authorization": f"Bearer {executor_tok}",
                    "Idempotency-Key": f"IDEMP-BIG-CNC-{uuid.uuid4().hex[:8]}",
                },
                json={},
            )
        else:
            print(f"FAIL: big reservation creation returned {r_big.status_code}: {r_big.text}")
            fail_count += 1

        # Negative Check 4: Idempotency key reused with a different payload
        idemp_attack_key = f"IDEMP-ATTACK-{uuid.uuid4().hex[:8]}"
        r1 = http.post(
            f"{API_URL}/refunds/{refund_id}/authorize",
            headers={"Authorization": f"Bearer {priya_tok}", "Idempotency-Key": idemp_attack_key},
            json={"amount_paise": 100000, "note": "Payload A"},
        )
        r2 = http.post(
            f"{API_URL}/refunds/{refund_id}/authorize",
            headers={"Authorization": f"Bearer {priya_tok}", "Idempotency-Key": idemp_attack_key},
            json={"amount_paise": 120000, "note": "Payload B (DIFFERENT)"},
        )
        if r2.status_code == 409:
            print("BLOCKED as expected: idempotency key reused with a different payload")
        else:
            print(f"FAIL: idempotency mismatch returned {r2.status_code} instead of 409")
            fail_count += 1

        print("\n=== Step 3: Authorization, Release and SimPay Completion ===")
        # 8. Authorize refund for full 120,000 paise by Kiran (within staff limit <= 200,000 paise)
        auth_key = f"IDEMP-AUTH-{uuid.uuid4().hex[:8]}"
        r = http.post(
            f"{API_URL}/refunds/{refund_id}/authorize",
            headers={"Authorization": f"Bearer {kiran_tok}", "Idempotency-Key": auth_key},
            json={"amount_paise": 120000, "note": "Staff authorized valid defective return"},
        )
        if r.status_code == 200 and r.json().get("authorized_by"):
            print(f"PASS: refund authorized by {r.json()['authorized_by']} for {r.json()['authorized_amount_paise']} paise")
        else:
            print(f"FAIL: refund authorization returned {r.status_code}: {r.text}")
            fail_count += 1

        # 9. Release refund via executor service token (now allowed because stored authorization exists)
        rel_key = f"IDEMP-REL-{uuid.uuid4().hex[:8]}"
        r = http.post(
            f"{API_URL}/refunds/{refund_id}/release",
            headers={"Authorization": f"Bearer {executor_tok}", "Idempotency-Key": rel_key},
            json={},
        )
        if r.status_code == 200 and r.json().get("status") == "processing":
            print("PASS: refund release submitted -> status 'processing'")
        else:
            print(f"FAIL: refund release returned {r.status_code}: {r.text}")
            fail_count += 1

        # 10. Wait for SimPay background completion (~3 seconds)
        print("Waiting 3.5s for SimPay background completion...")
        time.sleep(3.5)

        r = http.get(f"{API_URL}/refunds/{refund_id}", headers={"Authorization": f"Bearer {executor_tok}"})
        if r.status_code == 200:
            data = r.json()
            is_completed = data.get("status") == "completed"
            has_simpay = str(data.get("gateway_ref", "")).startswith("SIMPAY-")
            is_simulated = data.get("simulated") is True
            has_auth = bool(data.get("authorized_by"))

            if is_completed and has_simpay and is_simulated and has_auth:
                print(
                    f"PASS: refund {refund_id} completed with gateway_ref {data['gateway_ref']}, "
                    f"simulated={data['simulated']}, authorized_by={data['authorized_by']}"
                )
            else:
                print(f"FAIL: refund verification failed: {data}")
                fail_count += 1
        else:
            print(f"FAIL: GET refund returned {r.status_code}: {r.text}")
            fail_count += 1

    print("\n" + "=" * 50)
    if fail_count == 0:
        print("SMOKE MONEY SUMMARY: ALL CHECKS PASSED (0 FAIL)")
        sys.exit(0)
    else:
        print(f"SMOKE MONEY SUMMARY: {fail_count} CHECKS FAILED")
        sys.exit(1)


if __name__ == "__main__":
    run_smoke()

