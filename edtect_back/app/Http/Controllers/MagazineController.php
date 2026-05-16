<?php

namespace App\Http\Controllers;

use App\Models\Magazine;
use App\Models\Quiz;
use App\Models\MagazinePurchase;
use App\Traits\ApiResponser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class MagazineController extends Controller
{
    use ApiResponser;

    public function index()
    {
        $user = auth()->user();
        $magazines = Magazine::with('quiz')->latest()->get();
        
        $purchasedIds = $user ? $user->magazinePurchases()->where('payment_status', 'completed')->pluck('magazine_id')->toArray() : [];
        
        $magazines->each(function($mag) use ($purchasedIds) {
            $mag->is_purchased = in_array($mag->id, $purchasedIds);
        });

        return $this->set_response($magazines, 200, 'success', ['Magazines list.']);
    }

    public function show($id)
    {
        $magazine = Magazine::with('quiz.questions')->find($id);
        if (!$magazine) {
            return $this->set_response(null, 404, 'failed', ['Magazine not found.']);
        }
        return $this->set_response($magazine, 200, 'success', ['Magazine data.']);
    }

    public function purchase(Request $request, $id)
    {
        $user = auth()->user();
        $magazine = Magazine::find($id);

        if (!$magazine) {
            return $this->set_response(null, 404, 'failed', ['Magazine not found.']);
        }

        // Check if already purchased
        $existingPurchase = MagazinePurchase::where('user_id', $user->id)
            ->where('magazine_id', $magazine->id)
            ->where('payment_status', 'completed')
            ->first();

        if ($existingPurchase) {
            return $this->set_response(null, 400, 'failed', ['You have already purchased this magazine.']);
        }

        DB::beginTransaction();
        try {
            // In a real app, this would happen after payment gateway callback
            $purchase = MagazinePurchase::create([
                'user_id' => $user->id,
                'magazine_id' => $magazine->id,
                'amount' => $magazine->price,
                'payment_status' => 'completed',
                'transaction_id' => 'MOCK_' . uniqid(),
                'payment_method' => 'wallet', // or bkash, nagad etc
            ]);

            DB::commit();
            return $this->set_response($purchase, 200, 'success', ['Magazine purchased successfully.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->set_response(null, 500, 'error', [$e->getMessage()]);
        }
    }
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'month' => 'required|string',
            'title' => 'nullable|string',
            'price' => 'required|numeric',
            'pages' => 'required|integer',
            'topics' => 'required',
            'featured' => 'nullable',
            'color' => 'nullable|string',
            'pdf' => 'nullable|file|max:20480',
            'cover' => 'nullable|file|image|max:5120',
        ]);

        if ($validator->fails()) {
            return $this->set_response(null, 422, 'failed', $validator->errors()->all());
        }

        $data = $request->all();
        
        // Handle topics if sent as string from FormData
        if (is_string($request->topics)) {
            $data['topics'] = json_decode($request->topics, true) ?? explode(',', $request->topics);
        }

        if ($request->hasFile('pdf')) {
            $data['pdf_path'] = $request->file('pdf')->store('magazines/pdf', 'public');
        }
        
        if ($request->hasFile('cover')) {
            $data['image'] = $request->file('cover')->store('magazines/cover', 'public');
        }

        $magazine = Magazine::create($data);

        return $this->set_response($magazine, 201, 'success', ['Magazine created successfully.']);
    }

    public function uploadFile(Request $request, $id)
    {
        $magazine = Magazine::find($id);
        if (!$magazine) {
            return $this->set_response(null, 404, 'failed', ['Magazine not found.']);
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:20480', // 20MB max
            'type' => 'required|in:pdf,cover',
        ]);

        if ($validator->fails()) {
            return $this->set_response(null, 422, 'failed', $validator->errors()->all());
        }

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('magazines/' . $request->type, 'public');
            
            if ($request->type === 'pdf') {
                $magazine->update(['pdf_path' => $path]);
            } else {
                $magazine->update(['image' => $path]);
            }

            return $this->set_response(['path' => $path], 200, 'success', ['File uploaded successfully.']);
        }

        return $this->set_response(null, 400, 'failed', ['No file uploaded.']);
    }
}
