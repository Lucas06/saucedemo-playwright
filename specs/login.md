# Login: test plan

**Seed:** `tests/seed.spec.ts` · **Automated in:** `tests/auth/login.spec.ts`

## 1. Successful login

### 1.1 Standard user can log in and lands on the inventory `@smoke @positive`

**Steps:**

1. Open the login page.
2. Enter `standard_user` / valid password and submit.

**Expected:** URL is `/inventory.html`, the title reads "Products", and the product list is visible.

## 2. Rejected login

### 2.1 Locked out user is rejected with an explanatory error `@smoke @negative`

**Steps:**

1. Open the login page.
2. Enter `locked_out_user` / valid password and submit.

**Expected:** Error "Epic sadface: Sorry, this user has been locked out." is shown and the user stays on the login page.

### 2.2 Validation errors `@negative`

| Input                             | Expected error                                                              |
| --------------------------------- | --------------------------------------------------------------------------- |
| Unknown username + wrong password | "Epic sadface: Username and password do not match any user in this service" |
| Empty username                    | "Epic sadface: Username is required"                                        |
| Empty password                    | "Epic sadface: Password is required"                                        |
