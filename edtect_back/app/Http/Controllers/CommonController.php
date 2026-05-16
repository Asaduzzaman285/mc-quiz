<?php

namespace App\Http\Controllers;

use App\Traits\ApiResponser;
use Illuminate\Http\Request;

class CommonController extends Controller
{
    use ApiResponser;

    public function supportData()
    {
        // Provide empty or basic data to satisfy admin panel frontend
        $data = [
            'merchant_list' => [],
            'divisions' => ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh'],
        ];
        
        return $this->set_response($data, 200, 'success', ['Support data.']);
    }
}
