<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Magazine;
use App\Models\Quiz;
use App\Models\UserQuizResult;
use App\Models\MagazinePurchase;
use App\Traits\ApiResponser;
use Illuminate\Http\Request;

class CommonController extends Controller
{
    use ApiResponser;

    public function supportData(Request $request)
    {
        $divisions = [
            'Barishal', 'Chattogram', 'Dhaka', 'Khulna',
            'Mymensingh', 'Rajshahi', 'Rangpur', 'Sylhet'
        ];

        // Magazines list for filter dropdowns
        $magazines = Magazine::select('id', 'name', 'month', 'color', 'featured')
            ->latest()
            ->get()
            ->map(fn($m) => ['value' => $m->id, 'label' => $m->name . ' (' . $m->month . ')']);

        // Quizzes list for filter dropdowns
        $quizzes = Quiz::select('id', 'name', 'deadline', 'status')
            ->latest()
            ->get()
            ->map(fn($q) => ['value' => $q->id, 'label' => $q->name]);

        // Summary stats for admin dashboard
        $stats = [
            'total_users'     => User::role('student')->count(),
            'total_purchases' => MagazinePurchase::where('payment_status', 'completed')->count(),
            'total_revenue'   => MagazinePurchase::where('payment_status', 'completed')->sum('amount'),
            'total_quiz_submissions' => UserQuizResult::count(),
            'active_magazines' => Magazine::count(),
            'active_quizzes'   => Quiz::count(),
        ];

        // Districts by division
        $districtsByDivision = [
            'Barishal'    => ['Barguna','Barishal','Bhola','Jhalokati','Patuakhali','Pirojpur'],
            'Chattogram'  => ['Bandarban','Brahmanbaria','Chandpur','Chattogram','Cumilla','Cox\'s Bazar','Feni','Khagrachhari','Lakshmipur','Noakhali','Rangamati'],
            'Dhaka'       => ['Dhaka','Faridpur','Gazipur','Gopalganj','Kishoreganj','Madaripur','Manikganj','Munshiganj','Narayanganj','Narsingdi','Rajbari','Shariatpur','Tangail'],
            'Khulna'      => ['Bagerhat','Chuadanga','Jessore','Jhenaidah','Khulna','Kushtia','Magura','Meherpur','Narail','Satkhira'],
            'Mymensingh'  => ['Jamalpur','Mymensingh','Netrokona','Sherpur'],
            'Rajshahi'    => ['Bogra','Chapai Nawabganj','Joypurhat','Naogaon','Natore','Pabna','Rajshahi','Sirajganj'],
            'Rangpur'     => ['Dinajpur','Gaibandha','Kurigram','Lalmonirhat','Nilphamari','Panchagarh','Rangpur','Thakurgaon'],
            'Sylhet'      => ['Habiganj','Moulvibazar','Sunamganj','Sylhet'],
        ];

        return $this->set_response([
            'divisions'             => $divisions,
            'districts_by_division' => $districtsByDivision,
            'magazines'             => $magazines,
            'quizzes'               => $quizzes,
            'stats'                 => $stats,
            'merchant_list'         => [], // kept for backward compat with admin panel
        ], 200, 'success', ['Support data.']);
    }
}
