<?php

namespace App\Http\Controllers;

use App\Models\MagazinePurchase;
use App\Traits\ApiResponser;
use Illuminate\Http\Request;

class PurchaseController extends Controller
{
    use ApiResponser;

    public function index(Request $request)
    {
        $query = MagazinePurchase::with(['user:id,name,email,phone,district', 'magazine:id,name,month'])
            ->latest();

        // Filter by status
        if ($request->filled('status')) {
            $query->where('payment_status', $request->status);
        }

        // Filter by magazine
        if ($request->filled('magazine_id')) {
            $query->where('magazine_id', $request->magazine_id);
        }

        // Search by transaction_id
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                  ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%"));
            });
        }

        $purchases = $query->get()->map(function ($p) {
            return [
                'id'             => $p->id,
                'user_name'      => $p->user->name ?? '—',
                'user_email'     => $p->user->email ?? '—',
                'user_phone'     => $p->user->phone ?? '—',
                'user_district'  => $p->user->district ?? '—',
                'magazine_name'  => $p->magazine->name ?? '—',
                'magazine_month' => $p->magazine->month ?? '—',
                'amount'         => $p->amount,
                'payment_status' => $p->payment_status,
                'payment_method' => $p->payment_method,
                'transaction_id' => $p->transaction_id,
                'created_at'     => $p->created_at?->format('Y-m-d H:i'),
            ];
        });

        return $this->set_response($purchases, 200, 'success', ['Purchases list.']);
    }
}
