<?php

namespace App\Http\Controllers;

use App\Models\Magazine;
use App\Models\MagazinePurchase;
use App\Traits\ApiResponser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DownloadController extends Controller
{
    use ApiResponser;

    /**
     * Download a magazine PDF — only if the authenticated user has purchased it.
     */
    public function magazine(Request $request, $id)
    {
        $user     = auth()->user();
        $magazine = Magazine::find($id);

        if (!$magazine) {
            return $this->set_response(null, 404, 'failed', ['Magazine not found.']);
        }

        if (!$magazine->pdf_path) {
            return $this->set_response(null, 404, 'failed', ['PDF not available for this magazine yet.']);
        }

        // Check purchase
        $purchased = MagazinePurchase::where('user_id', $user->id)
            ->where('magazine_id', $magazine->id)
            ->where('payment_status', 'completed')
            ->exists();

        if (!$purchased) {
            return $this->set_response(null, 403, 'failed', ['You must purchase this magazine to download it.']);
        }

        // Serve the file as a download
        $path = $magazine->pdf_path; // e.g. "magazines/pdf/xxx.pdf"

        if (!Storage::disk('public')->exists($path)) {
            return $this->set_response(null, 404, 'failed', ['PDF file not found on server.']);
        }

        $fullPath = Storage::disk('public')->path($path);
        $filename = 'MCQuiz_' . str_replace(' ', '_', $magazine->name) . '.pdf';

        return response()->download($fullPath, $filename, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
