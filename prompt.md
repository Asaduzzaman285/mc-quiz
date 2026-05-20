You are a senior Laravel backend engineer working inside an EXISTING Laravel project.
The project already has: Laravel Passport (OAuth2 auth), Spatie Laravel Permission (RBAC),
and a FileController for file uploads. DO NOT regenerate or modify any of these.

=======================================================================
PROJECT: MCQuiz — Bangladesh Competitive Edtech Quiz Platform
=======================================================================

CONCEPT:
- Users purchase a periodic MCQ ebook (BDT 50) covering current affairs
- Purchase grants access to a timed competitive quiz
- Top 20 performers win bKash/Nagad cash prizes
- Issues are NOT monthly-only: admin sets any period (7/15/30/custom days)
- Quiz: 3 minutes, randomized MCQs, ranked by correct answers then speed

=======================================================================
EXISTING SYSTEM — DO NOT TOUCH OR REGENERATE
=======================================================================

1. AUTH: Laravel Passport installed. Login/Register/Logout exist.
   Users table exists with standard fields.

2. RBAC: spatie/laravel-permission installed and working.
   Do not reinstall. Only add roles/permissions via seeder.

3. FILE UPLOAD: App\Http\Controllers\Configuration\FileController exists.
   Method: fileUpload(Request $request)
   Accepts: file, file_path (string), file_name (string)
   Returns: { "data": { "file_path": "storage/path/to/file.ext" } }
   The returned file_path string is how all uploaded files are referenced.

4. RESPONSE TRAIT: ApiResponser trait exists on all controllers.
   ALWAYS use this exact format — never use raw response():
   Success : $this->set_response($data, 200, 'success', ['message']);
   Failure : $this->set_response(null, 422, 'failed', ['error']);
   Error   : $this->set_response(null, 500, 'error', ['Something went wrong']);

5. ALL routes use auth:api (Passport). NEVER use auth:sanctum.

=======================================================================
SECTION 1: NEW MIGRATIONS
(Run in this exact order — foreign key dependency order)
=======================================================================

1. modify_users_table_for_mcquiz
   Add to existing users table:
   - bkash_number   : string(20), nullable
   - nagad_number   : string(20), nullable
   - otp            : string(6),  nullable
   - otp_expires_at : timestamp,  nullable
   - otp_verified   : boolean, default false

2. create_issues_table
   - id, timestamps
   - title         : string
   - period_type   : enum[weekly, biweekly, monthly, custom], default monthly
   - period_label  : string   — human label e.g. "June 2025", "Week 1 – June"
   - ebook_file_path : string, nullable  — path from file upload API
   - price         : decimal(8,2), default 50.00
   - total_questions : integer, default 200
   - status        : enum[draft, active, quiz_open, quiz_closed, result_published]
                     default: draft
   - valid_from    : date, nullable
   - valid_until   : date, nullable
   - quiz_starts_at : timestamp, nullable
   - quiz_ends_at  : timestamp, nullable
   - result_published_at : timestamp, nullable

3. create_questions_table
   - id, timestamps
   - issue_id      : foreignId, constrained, cascadeOnDelete
   - question_text : text
   - option_a      : string
   - option_b      : string
   - option_c      : string
   - option_d      : string
   - correct_option : enum[a, b, c, d]
   - order_index   : integer  — original Excel row order

4. create_purchases_table
   - id, timestamps
   - user_id       : foreignId, constrained, cascadeOnDelete
   - issue_id      : foreignId, constrained, cascadeOnDelete
   - amount        : decimal(8,2)
   - currency      : string(3), default BDT
   - payment_gateway : string  — 'bkash' | 'nagad'
   - payment_id    : string, nullable   — gateway session ID
   - transaction_id : string, nullable, unique  — final TXN ID
   - merchant_invoice : string, nullable, unique
   - bkash_number  : string(20), nullable
   - status        : enum[pending, paid, failed, refunded], default pending
   - gateway_response : json, nullable  — full raw gateway response
   - paid_at       : timestamp, nullable
   - unique([user_id, issue_id])

5. create_quiz_sessions_table
   - id, timestamps
   - user_id       : foreignId, constrained, cascadeOnDelete
   - issue_id      : foreignId, constrained, cascadeOnDelete
   - started_at    : timestamp, nullable
   - submitted_at  : timestamp, nullable
   - total_answered : integer, default 0
   - correct_count : integer, default 0
   - time_taken_seconds : integer, nullable
   - status        : enum[in_progress, submitted, timed_out], default in_progress

6. create_quiz_answers_table
   - id, timestamps
   - session_id    : foreignId (quiz_sessions), constrained, cascadeOnDelete
   - question_id   : foreignId (questions), constrained, cascadeOnDelete
   - selected_option : enum[a, b, c, d], nullable
   - is_correct    : boolean, default false

7. create_leaderboard_snapshots_table
   - id  (no timestamps — this is a cache table, snapshot_at serves that purpose)
   - issue_id      : foreignId, constrained, cascadeOnDelete
   - user_id       : foreignId, constrained, cascadeOnDelete
   - rank_position : integer
   - correct_count : integer
   - time_taken_seconds : integer
   - winning_probability : float
   - snapshot_at   : timestamp

8. create_results_table
   - id, timestamps
   - issue_id      : foreignId, constrained, cascadeOnDelete
   - user_id       : foreignId, constrained, cascadeOnDelete
   - final_rank    : integer
   - prize_amount  : decimal(8,2)
   - payment_status : enum[pending, paid, failed], default pending
   - payment_gateway : string, nullable   — bkash | nagad
   - payout_transaction_id : string, nullable
   - display_name  : string, nullable   — e.g. "Rahim • Dhaka"
   - paid_at       : timestamp, nullable
   - unique([issue_id, user_id])

9. create_demo_sessions_table
   - id
   - user_id       : foreignId, constrained, cascadeOnDelete
   - played_at     : timestamp

=======================================================================
SECTION 2: MODELS
=======================================================================

Create Eloquent models for:
Issue, Question, Purchase, QuizSession, QuizAnswer,
LeaderboardSnapshot, Result, DemoSession

Each model needs:
- Correct $fillable
- $casts (json → array, decimals, datetimes, booleans)
- All relationships (belongsTo, hasMany)
- Status constants as class constants
- Helper booleans: isPaid(), isActive(), isQuizOpen(), isPastDeadline()

Update existing User model — ADD ONLY (do not overwrite):
- Add to $fillable: bkash_number, nagad_number, otp, otp_expires_at, otp_verified
- Add relationships: purchases(), quizSessions(), results()
- Add helper: hasValidOtp() → checks otp not null AND otp_expires_at > now()

=======================================================================
SECTION 3: OTP SYSTEM
=======================================================================

IMPORTANT DESIGN NOTE:
- OTP is required before a user can start the quiz
- Real SMS is NOT connected yet — a dev route exposes the OTP for testing
- The dev route must be completely disabled in production (APP_ENV check)
- When SMS is ready, only the OtpService::send() method needs updating

3a. OtpService
File: app/Services/OtpService.php

generateAndSave(User $user): string
  - Generate cryptographically random 6-digit OTP: str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT)
  - Save to user: otp = generated, otp_expires_at = now()+10min, otp_verified = false
  - Call self::send($user, $otp)
  - Return the OTP string

send(User $user, string $otp): void
  - TODO: Integrate Bangladesh SMS gateway here (e.g. SSL Wireless, Infobip)
  - For now: Log::info("OTP for user {$user->id}: {$otp}") — just logs it
  - Add comment: // PRODUCTION: replace Log::info with real SMS API call

verify(User $user, string $inputOtp): bool
  - Check $user->otp === $inputOtp AND $user->otp_expires_at > now()
  - On success: update user — otp = null, otp_expires_at = null, otp_verified = true
  - Return true on success, false on failure

3b. OtpController
File: app/Http/Controllers/OtpController.php
Uses ApiResponser trait, middleware: auth:api

POST /api/otp/send
  - Call OtpService::generateAndSave(Auth::user())
  - Return: { message: "OTP sent. Check your phone." }
  - Do NOT return the OTP value in this response (even in dev)

POST /api/otp/verify
  - Validate: otp required|digits:6
  - Call OtpService::verify(Auth::user(), $request->otp)
  - Success: return { verified: true, message: "OTP verified. You may start the quiz." }
  - Failure: return 422 { message: "Invalid or expired OTP." }

3c. DevOtpController  ← DEVELOPMENT ONLY
File: app/Http/Controllers/Dev/DevOtpController.php

GET /api/dev/otp/{user_id}
  CRITICAL GUARD — first line of the method:
  if (app()->environment('production')) {
      abort(404);
  }
  - Find user by id
  - If user has no OTP or otp_expires_at < now(): return 404 "No active OTP"
  - Return plaintext JSON: {
        user_id,
        email,
        otp,
        otp_expires_at,
        expires_in_seconds: otp_expires_at->diffInSeconds(now()),
        note: "DEV ONLY — this route is disabled in production"
    }

This route is registered OUTSIDE auth middleware — no login needed for dev testing.
Add route comment: // DEV ONLY — remove or guard in production deployment checklist

=======================================================================
SECTION 4: PAYMENT SYSTEM (bKash + Nagad)
=======================================================================

4a. PaymentGatewayInterface
File: app/Services/Payment/PaymentGatewayInterface.php

interface PaymentGatewayInterface {
    public function initiate(array $payload): array;
    public function execute(array $payload): array;
    public function queryTransaction(string $transactionId): array;
}

Standard return shape for initiate():
{
  success: bool,
  payment_id: string,
  redirect_url: string,     — gateway payment page URL (redirect user here)
  amount: float,
  currency: 'BDT',
  merchant_invoice: string,
  expires_at: ISO8601 string,
  gateway: 'bkash'|'nagad',
}

Standard return shape for execute():
Success: { success: true, transaction_id, status: 'completed', amount, currency,
           payer_number, payment_id, merchant_invoice, completed_at, gateway }
Failure: { success: false, transaction_id: null, status: 'failed',
           error_code, message, gateway }

4b. BkashPaymentGateway
File: app/Services/Payment/BkashPaymentGateway.php
Implements PaymentGatewayInterface

Constructor: __construct(string $appKey, string $appSecret, string $username, 
                         string $password, bool $sandbox = true)
Set baseUrl:
  sandbox    → https://tokenized.sandbox.bka.sh/v1.2.0-beta
  production → https://tokenized.pay.bka.sh/v1.2.0-beta

Token (getToken() private method):
  POST {baseUrl}/tokenized/checkout/token/grant
  Headers: username, password, Content-Type: application/json
  Body: { app_key, app_secret }
  Cache key: 'bkash_token_' . md5($appKey), TTL: 55 minutes
  statusCode '0000' = success
  Throw RuntimeException on failure

initiate():
  POST {baseUrl}/tokenized/checkout/create
  Headers: Authorization: {token}, X-APP-Key: {appKey}
  Body: { mode: '0011', payerReference: (string)user_id,
          callbackURL: route('payment.callback', ['gateway'=>'bkash']),
          amount: number_format(amount, 2, '.', ''),
          currency: 'BDT', intent: 'sale',
          merchantInvoiceNumber: invoice_id }
  Map response: payment_id = paymentID, redirect_url = bkashURL
  Log request + response via Log::info()

execute():
  POST {baseUrl}/tokenized/checkout/execute
  Body: { paymentID: payment_id }
  Map response: transaction_id = trxID, payer_number = customerMsisdn
  Log request + response

queryTransaction():
  POST {baseUrl}/tokenized/checkout/transaction/status
  Body: { trxID: transactionId }

Sandbox credentials (use as env defaults):
  app_key    : 0vWQuCRGiUX7EPVjQDr0gkko5J
  app_secret : jcUNPBgbcqEDedNKdvE4G1cAK7D3hCjmJccNPZZBq96QIxxwAMEx
  username   : sandboxTokenizedUser02
  password   : sandboxTokenizedUser02@12345

4c. NagadPaymentGateway
File: app/Services/Payment/NagadPaymentGateway.php
Implements PaymentGatewayInterface

Constructor: __construct(string $merchantId, string $merchantNumber,
                         string $publicKey, string $privateKey, bool $sandbox = true)
Set baseUrl:
  sandbox    → https://sandbox.mynagad.com:10080/remote-payment-gateway-1.0
  production → https://api.mynagad.com/api/dfs

NOTE: Nagad uses asymmetric encryption — all request bodies are encrypted.

Private helper encryptBody(array $data): string
  Use openssl_private_encrypt() with $this->privateKey
  Return base64_encode of encrypted data

Private helper decryptResponse(string $encryptedData): array
  Use openssl_public_decrypt() with $this->publicKey
  Return json_decode of decrypted data

initiate():
  Step 1 — Create Payment:
    POST {baseUrl}/check-out/initialize/{merchantId}/{orderId}
    Headers: X-KM-Api-Version: v-0.2.0, X-KM-IP-V4: server IP,
             X-KM-Client-Type: PC, Content-Type: application/json
    Body (encrypted): { merchantId, orderId, challenge: random 40-char hex }
    On success get: paymentReferenceId, challenge (verify it matches)

  Step 2 — Complete Checkout:
    POST {baseUrl}/check-out/complete/{merchantId}/{orderId}
    Body (encrypted): { mandatoryString: md5(merchantId+orderId+challenge),
                        merchantId, orderId, currencyCode: '050',
                        amount: string, challenge }
    On success get: callBackUrl → this is the redirect_url for the user

  Map standard return shape, gateway: 'nagad'
  Log all steps

execute():
  GET {baseUrl}/verify/{paymentRefId}
  Headers: X-KM-Api-Version, X-KM-IP-V4, X-KM-Client-Type
  Decrypt response body
  statusCode '000' = success
  Map: transaction_id = issuerPaymentRefNo, payer_number = mobile

queryTransaction():
  GET {baseUrl}/verify/{transactionId}
  Same as execute verify endpoint

TODO comment: Nagad sandbox credentials require merchant registration at
https://nagad.com.bd — add NAGAD_MERCHANT_ID, NAGAD_MERCHANT_NUMBER,
NAGAD_PUBLIC_KEY, NAGAD_PRIVATE_KEY to .env when available.

4d. PaymentServiceProvider
File: app/Providers/PaymentServiceProvider.php
DO NOT bind as singleton — each resolution reads fresh config.

Register both gateways, chosen at runtime by the request payload:

$this->app->bind('payment.bkash', function() {
    return new BkashPaymentGateway(
        config('payment.bkash.app_key'),
        config('payment.bkash.app_secret'),
        config('payment.bkash.username'),
        config('payment.bkash.password'),
        config('payment.bkash.sandbox'),
    );
});

$this->app->bind('payment.nagad', function() {
    return new NagadPaymentGateway(
        config('payment.nagad.merchant_id'),
        config('payment.nagad.merchant_number'),
        config('payment.nagad.public_key'),
        config('payment.nagad.private_key'),
        config('payment.nagad.sandbox'),
    );
});

Also bind PaymentGatewayInterface to default gateway from config:
$this->app->bind(PaymentGatewayInterface::class, function($app) {
    return $app->make('payment.' . config('payment.default_gateway'));
});

4e. PaymentGatewayResolver service
File: app/Services/Payment/PaymentGatewayResolver.php

resolve(string $gateway): PaymentGatewayInterface
  return match($gateway) {
      'bkash' => app('payment.bkash'),
      'nagad'  => app('payment.nagad'),
      default  => throw new \InvalidArgumentException("Unknown gateway: {$gateway}"),
  };

4f. config/payment.php
return [
    'default_gateway' => env('PAYMENT_DEFAULT_GATEWAY', 'bkash'),
    'bkash' => [
        'app_key'    => env('BKASH_APP_KEY',    '0vWQuCRGiUX7EPVjQDr0gkko5J'),
        'app_secret' => env('BKASH_APP_SECRET', 'jcUNPBgbcqEDedNKdvE4G1cAK7D3hCjmJccNPZZBq96QIxxwAMEx'),
        'username'   => env('BKASH_USERNAME',   'sandboxTokenizedUser02'),
        'password'   => env('BKASH_PASSWORD',   'sandboxTokenizedUser02@12345'),
        'sandbox'    => env('BKASH_SANDBOX',    true),
    ],
    'nagad' => [
        'merchant_id'     => env('NAGAD_MERCHANT_ID',     '683002007104225'),
        'merchant_number' => env('NAGAD_MERCHANT_NUMBER', '01700000000'),
        'public_key'      => env('NAGAD_PUBLIC_KEY',      ''),
        'private_key'     => env('NAGAD_PRIVATE_KEY',     ''),
        'sandbox'         => env('NAGAD_SANDBOX',         true),
    ],
];

4g. PaymentController
File: app/Http/Controllers/PaymentController.php
Uses: ApiResponser, auth:api, PaymentGatewayResolver injected via constructor

POST /api/payment/initiate
  Validate: issue_id required|exists:issues,id
            gateway  required|in:bkash,nagad

  - Block if user already has paid purchase for this issue (409)
  - Block if issue status not in [active, quiz_open] (422)
  - Generate invoice: 'INV-{issue_id}-{user_id}-{time()}'
  - Resolve gateway: $this->resolver->resolve($request->gateway)
  - Call gateway->initiate([amount, currency, invoice_id, user_id, issue_id])
  - Create Purchase: status=pending, payment_gateway=$request->gateway,
    payment_id from response, merchant_invoice, bkash_number=$user->bkash_number
  - Return: { purchase_id, payment_id, redirect_url, amount, 
              expires_at, gateway }
  NOTE: frontend redirects the user to redirect_url (gateway payment page)

GET /api/payment/callback/{gateway}  [NO auth middleware]
  Route name: payment.callback
  Query params received from gateway: paymentID (bkash) or payment_ref_id (nagad),
                                      status
  
  Normalize payment_id:
    bkash → $request->query('paymentID')
    nagad → $request->query('payment_ref_id')

  - If status != 'success' → redirect to config('app.frontend_url').'/purchase?status=cancelled'
  - Find Purchase by payment_id and status=pending
  - Resolve gateway by $gateway param
  - Call gateway->execute(['payment_id' => $normalizedId, ...])
  - Success: update Purchase — status=paid, transaction_id, paid_at=now()
  - Failure: update Purchase — status=failed
  - Redirect to frontend: /purchase?status=success&issue_id=X&txn=Y
                       or /purchase?status=failed&reason=Z

GET /api/payment/status/{issue_id}  [auth:api]
  Return user's latest purchase for that issue:
  { purchased: bool, status, gateway, transaction_id, paid_at }

=======================================================================
SECTION 5: ISSUE MANAGEMENT
=======================================================================

IssueController — admin only, permission: manage-issues
Prefix: /api/admin/issues

GET    /
  Paginated, filterable by status and period_type
  Include: question_count (count of related questions)

POST   /
  Validate:
    title          : required|string|max:255
    period_type    : required|in:weekly,biweekly,monthly,custom
    period_label   : required|string|max:100
    price          : nullable|numeric|min:0, default 50
    valid_from     : required|date
    valid_until    : required|date|after:valid_from
    quiz_starts_at : required|date|after_or_equal:valid_from
    quiz_ends_at   : required|date|after:quiz_starts_at|before_or_equal:valid_until

GET    /{id}       — show with question_count and participant_count
PUT    /{id}       — update (only if draft or active)
DELETE /{id}       — only if draft

POST   /{id}/upload-ebook
  Accept: file (pdf only, max 10MB)
  Call existing FileController::fileUpload() internally with:
    file_path: 'ebooks'
    file_name: 'ebook_' . $issue->id . '_' . $issue->valid_from
  Save returned file_path to issues.ebook_file_path
  Return: { ebook_file_path }

POST   /{id}/status
  Validate: status in enum list
  Allowed transitions ONLY:
    draft           → active
    active          → quiz_open
    quiz_open       → quiz_closed
    quiz_closed     → result_published
  Return updated issue

GET /api/issues/current  [PUBLIC — no auth]
  Return active or quiz_open issue:
  { id, title, period_type, period_label, valid_from, valid_until,
    price, status, quiz_starts_at, quiz_ends_at,
    time_until_quiz_seconds, question_count }

=======================================================================
SECTION 6: QUESTION MANAGEMENT
=======================================================================

QuestionController — permission: upload-questions
Routes under /api/admin

POST /api/admin/issues/{issue_id}/questions/import
  Accept: file (.xlsx only)
  Step 1: Call FileController::fileUpload() internally:
          file_path = 'question-imports'
          file_name = 'questions_' . $issue_id . '_' . time()
  Step 2: Dispatch QuestionImportJob::dispatch($issue_id, $storedFilePath)
  Return: { message: "Import queued.", file_path, issue_id }

QuestionImportJob — implements ShouldQueue
File: app/Jobs/QuestionImportJob.php
  - Install/use maatwebsite/excel
  - Expected Excel columns (row 1 = header, skip it):
    question_text | option_a | option_b | option_c | option_d | correct_option
  - correct_option: trim + strtolower → must be a, b, c, or d. Skip invalid rows.
  - Delete all existing questions for this issue first
  - Bulk insert in chunks of 100 using Question::insert()
  - Each row: order_index = Excel row number (2-based)
  - After insert: update issues.total_questions = count of inserted rows
  - Log::info("Imported {$count} questions for issue {$issueId}")

GET  /api/admin/issues/{issue_id}/questions     — paginated, includes correct_option
GET  /api/admin/issues/{issue_id}/questions/{id}
PUT  /api/admin/issues/{issue_id}/questions/{id}
DELETE /api/admin/issues/{issue_id}/questions/{id}

=======================================================================
SECTION 7: QUIZ ENGINE
=======================================================================

QuizController — auth:api

POST /api/quiz/start
  Validate: issue_id required|exists:issues,id

  Guards (in order, return specific error for each):
  1. Check Purchase paid for this user+issue → 403 "Purchase required"
  2. Check issue status = quiz_open → 422 "Quiz is not currently open"
  3. Check users.otp_verified = true → 403 "OTP verification required before quiz"
     Reset otp_verified to false after this check so it can't be reused
  4. Check no existing in_progress session for user+issue → 409 "Quiz already in progress"

  - Fetch all questions for issue (id, question_text, option_a, b, c, d only — NO correct_option)
  - Shuffle: use Fisher-Yates via collect()->shuffle()
    NOTE: seed not needed — full randomness per attempt is intentional
  - Create QuizSession: status=in_progress, started_at=now()
  - Return: { session_id, questions: [shuffled, no correct_option],
              duration_seconds: 180, started_at }

POST /api/quiz/submit
  Validate:
    session_id                   : required|exists:quiz_sessions,id
    answers                      : required|array
    answers.*.question_id        : required|exists:questions,id
    answers.*.selected_option    : required|in:a,b,c,d

  Guards:
  1. Find session where id=$session_id AND user_id=auth()->id() AND status=in_progress
     → 404 if not found
  2. Check session.started_at + 180s > now()
     If expired: mark as timed_out, return 422 "Quiz time has expired"

  Processing:
  - time_taken_seconds = min(180, now()->diffInSeconds($session->started_at))
  - Load correct answers: Question::whereIn('id', $questionIds)->pluck('correct_option', 'id')
  - For each answer: is_correct = (selected_option === correct_option)
  - Bulk insert QuizAnswers
  - correct_count = count of is_correct=true answers
  - total_answered = count of answers array
  - accuracy_pct = round((correct_count / total_answered) * 100, 2)

  Update QuizSession:
    correct_count, total_answered, time_taken_seconds,
    status=submitted, submitted_at=now()

  Comparison logic:
  - Find most recent OTHER submitted session for this user (any issue, before this one)
  - If found:
      prev_accuracy = round((prev.correct_count / prev.total_answered) * 100, 2)
      time_delta = prev.time_taken_seconds - current.time_taken_seconds
                   (positive = faster this time)
      accuracy_delta = accuracy_pct - prev_accuracy
                       (positive = improved)
  - has_previous = found ? true : false

  Winning probability:
  - worse_sessions = count of submitted sessions for THIS issue where:
      correct_count < current OR (correct_count = current AND time_taken > current_time)
  - total_sessions = count of submitted sessions for this issue
  - probability = total_sessions > 0 ? round((worse_sessions/total_sessions)*100, 2) : 100.0

  Reset otp_verified = false on user (already done at quiz start, but ensure clean state)

  Return popup payload:
  {
    time_taken_seconds,
    correct_count,
    total_answered,
    accuracy_percentage,
    winning_probability,
    comparison: {
      has_previous,
      time_delta_seconds,
      accuracy_delta_percentage
    },
    result_publish_date: issue.result_published_at ?? issue.quiz_ends_at->addDays(3)
  }

GET /api/quiz/session/{session_id}  [auth:api]
  Return own session summary only (verify user_id matches)

=======================================================================
SECTION 8: LEADERBOARD
=======================================================================

LeaderboardController — auth:api

GET /api/leaderboard/{issue_id}
  - Fetch top 50 rows from leaderboard_snapshots for this issue
  - If no snapshot exists yet: call UpdateLeaderboardJob::dispatchSync($issue_id)
    to generate one on-demand, then fetch
  - Find auth user's own snapshot for this issue (may be null if outside top 50)
  - Return:
    {
      top_50: [{ rank, display_name, correct_count, time_taken_seconds }],
      my_position: { rank, correct_count, time_taken_seconds } | null,
      total_participants: int,
      last_updated_at: snapshot_at of any row for this issue,
      next_update_at:  last_updated_at + 2 minutes,
      issue_status: string
    }
  - display_name: first word of users.name + " • " + (users.city ?? "BD")
    NEVER expose email, full name, or bkash_number

UpdateLeaderboardJob — implements ShouldQueue
File: app/Jobs/UpdateLeaderboardJob.php
  Accepts: int $issueId

  - Get all submitted sessions for issue, order by correct_count DESC, time_taken_seconds ASC
  - Take top 50
  - total_sessions = count ALL submitted sessions for this issue
  - For each row (1..N):
      rank_position = N (1-indexed)
      worse_count = total_sessions - N
      winning_probability = round((worse_count / total_sessions) * 100, 2)
  - DB::transaction:
      LeaderboardSnapshot::where('issue_id', $issueId)->delete()
      LeaderboardSnapshot::insert($rows) with snapshot_at = now()
  - Log::info("Leaderboard updated for issue {$issueId}, {$count} entries")

Artisan Command: UpdateLeaderboardCommand
  php artisan leaderboard:update
  - Get all issues with status=quiz_open
  - Dispatch UpdateLeaderboardJob for each
  - Schedule: ->everyTwoMinutes() in console.php / Kernel.php

=======================================================================
SECTION 9: RESULTS
=======================================================================

ResultController

POST /api/admin/results/{issue_id}/publish  [permission: publish-results]
  - issue must have status=quiz_closed (422 otherwise)
  - Get top 20 from leaderboard_snapshots for this issue
  - Get prize pool from config('quiz.prize_pool')
  - DB::transaction:
      foreach top 20: Result::create(issue_id, user_id, final_rank,
                       prize_amount=config prize, payment_status=pending)
      Issue::find($issueId)->update(status=result_published, result_published_at=now())
  - Return: { published: true, total_winners: count }

GET /api/results/{issue_id}  [PUBLIC]
  - Return winner list:
    [{ rank, display_name, prize_amount, payment_status }]
  - display_name = first word of name + " • " + city
  - Never expose bkash_number, full name, email

PUT /api/admin/results/{result_id}/mark-paid  [permission: process-payments]
  Validate: payout_transaction_id required|string
            payment_gateway required|in:bkash,nagad
  Update: payment_status=paid, payout_transaction_id, payment_gateway, paid_at=now()

=======================================================================
SECTION 10: SCHEDULED COMMANDS
=======================================================================

All commands registered in routes/console.php (Laravel 11) or Kernel.php (Laravel 10)

1. UpdateLeaderboardCommand       → everyTwoMinutes()
   php artisan leaderboard:update (described in Section 8)

2. TimeoutQuizSessionsCommand
   php artisan quiz:timeout-sessions
   Find quiz_sessions where status=in_progress
   AND started_at < now()->subSeconds(180)
   Update to status=timed_out
   Schedule: everyMinute()

3. UpdateIssueStatusCommand
   php artisan issues:update-status
   - active issues where quiz_starts_at <= now()   → set quiz_open
   - quiz_open issues where quiz_ends_at <= now()  → set quiz_closed
   Schedule: everyMinute()

=======================================================================
SECTION 11: MIDDLEWARE
=======================================================================

EnsureIssuePurchased
File: app/Http/Middleware/EnsureIssuePurchased.php
  - Get issue_id from request->input('issue_id') ?? request->route('issue_id')
  - Check purchases: user_id=auth user, issue_id, status=paid
  - Return 403 using set_response format if not found
  Register as alias 'purchased' in bootstrap/app.php or Kernel.php

=======================================================================
SECTION 12: ROUTES (routes/api.php)
=======================================================================

// ── PUBLIC (no auth) ──────────────────────────────────────────────
Route::get('/issues/current', [IssueController::class, 'current']);
Route::get('/results/{issue_id}', [ResultController::class, 'index']);
Route::get('/payment/callback/{gateway}', [PaymentController::class, 'callback'])
     ->name('payment.callback');

// ── DEV ONLY (no auth, disabled in production via controller guard) ──
Route::get('/dev/otp/{user_id}', [DevOtpController::class, 'show']);
// NOTE: DevOtpController aborts 404 when APP_ENV=production

// ── AUTHENTICATED ─────────────────────────────────────────────────
Route::middleware('auth:api')->group(function () {

    // OTP
    Route::post('/otp/send',   [OtpController::class, 'send']);
    Route::post('/otp/verify', [OtpController::class, 'verify']);

    // Payment
    Route::post('/payment/initiate',           [PaymentController::class, 'initiate']);
    Route::get('/payment/status/{issue_id}',   [PaymentController::class, 'status']);

    // Leaderboard
    Route::get('/leaderboard/{issue_id}', [LeaderboardController::class, 'show']);

    // Quiz (purchase check via middleware)
    Route::middleware('purchased')->group(function () {
        Route::post('/quiz/start',               [QuizController::class, 'start']);
        Route::post('/quiz/submit',              [QuizController::class, 'submit']);
        Route::get('/quiz/session/{session_id}', [QuizController::class, 'session']);
    });
});

// ── ADMIN ─────────────────────────────────────────────────────────
Route::middleware('auth:api')->prefix('admin')->group(function () {
    // Issues
    Route::apiResource('issues', IssueController::class);
    Route::post('issues/{id}/upload-ebook', [IssueController::class, 'uploadEbook']);
    Route::post('issues/{id}/status',       [IssueController::class, 'updateStatus']);

    // Questions
    Route::post('issues/{issue_id}/questions/import', [QuestionController::class, 'import']);
    Route::apiResource('issues.questions', QuestionController::class)
         ->except(['create','edit']);

    // Results
    Route::post('results/{issue_id}/publish',       [ResultController::class, 'publish']);
    Route::put('results/{result_id}/mark-paid',     [ResultController::class, 'markPaid']);

    // Users
    Route::get('users',     [AdminUserController::class, 'index']);
    Route::get('users/{id}',[AdminUserController::class, 'show']);
    Route::put('users/{id}',[AdminUserController::class, 'update']);
});

=======================================================================
SECTION 13: SEEDERS
=======================================================================

RolePermissionSeeder:
Roles: super_admin, admin, user
Permissions: manage-issues, upload-questions, manage-users,
             publish-results, process-payments, manage-quiz

super_admin → ALL permissions
admin       → manage-issues, upload-questions, publish-results,
              process-payments, manage-quiz
user        → (none — controlled by purchase/otp middleware)

=======================================================================
SECTION 14: config/quiz.php
=======================================================================

return [
    'duration_seconds' => 180,
    'leaderboard_size' => 50,
    'top_winners'      => 20,
    'period_types' => [
        'weekly'   => 7,
        'biweekly' => 15,
        'monthly'  => 30,
        'custom'   => null,
    ],
    'prize_pool' => [
        1  => 2000,
        2  => 1500,
        3  => 1000,
        4  => 500,  5  => 500,  6  => 500,
        7  => 500,  8  => 500,  9  => 500,  10 => 500,
        11 => 200,  12 => 200,  13 => 200,  14 => 200,
        15 => 200,  16 => 200,  17 => 200,  18 => 200,
        19 => 200,  20 => 200,
    ],
];

=======================================================================
SECTION 15: .env ADDITIONS
=======================================================================

PAYMENT_DEFAULT_GATEWAY=bkash
BKASH_SANDBOX=true
BKASH_APP_KEY=0vWQuCRGiUX7EPVjQDr0gkko5J
BKASH_APP_SECRET=jcUNPBgbcqEDedNKdvE4G1cAK7D3hCjmJccNPZZBq96QIxxwAMEx
BKASH_USERNAME=sandboxTokenizedUser02
BKASH_PASSWORD=sandboxTokenizedUser02@12345

NAGAD_SANDBOX=true
NAGAD_MERCHANT_ID=683002007104225
NAGAD_MERCHANT_NUMBER=01700000000
NAGAD_PUBLIC_KEY=
NAGAD_PRIVATE_KEY=

FRONTEND_URL=http://localhost:3000

=======================================================================
FINAL RULES FOR CODE GENERATION
=======================================================================

1.  Generate ALL files completely — zero truncation, zero "// rest of code" placeholders
2.  Every controller method uses $this->set_response() from ApiResponser trait
3.  All routes: auth:api (Passport). Never auth:sanctum anywhere.
4.  Wrap all multi-table writes in DB::transaction()
5.  Validate ALL request inputs — never trust raw $request->input() without validation
6.  Log all payment gateway requests and responses: Log::info() with context array
7.  All jobs implement ShouldQueue
8.  DevOtpController must abort(404) when APP_ENV=production — this is critical
9.  Never expose: correct_option to quiz frontend, full name/email/bkash on leaderboard
10. Use PHP 8.1+ syntax: readonly properties, match(), named arguments, enums where clean
11. Add TODO comments at: OtpService::send() for SMS, NagadGateway for real credentials
12. DO NOT generate: Auth controllers, FileController, Passport config, Permission config
13. Generate in this order:
    Migrations → Models → Services → Jobs → Commands → 
    Middleware → Controllers → Routes → Seeders → Config files

Start now. Generate each file in full.  