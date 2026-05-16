import React, { useState, useEffect } from 'react';
import { FaHome, FaPrint, FaEllipsisV, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import Select from 'react-select';
import Swal from 'sweetalert2';
import SkeletonLoader from './SkeletonLoader';
import { hasPermission } from '../utils/permissions';
import headerLogo from '/assets/headerlogo_1.png';
const GrantAwardPage = () => {
    // API URLs
    const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
    const SUPPORT_DATA_URL = `${BASE_URL}/api/v1/award-management/support-data`;
    const CHECK_TICKET_URL = `${BASE_URL}/api/v1/award-management/ticket-sold-unsold-check`;
    const PICK_TICKETS_URL = `${BASE_URL}/api/v1/award-management/pick-tickets-for-award`;
    const CONFIRM_AWARD_URL = `${BASE_URL}/api/v1/award-management/grant-award-confirm`;

    // State
    const [loading, setLoading] = useState(false);
    const [awards, setAwards] = useState([]);
    const [showGrantModal, setShowGrantModal] = useState(false);
    const [selectedAward, setSelectedAward] = useState(null);
    const [ticketNumber, setTicketNumber] = useState('');
    const [ticketStatus, setTicketStatus] = useState(null); // 'sold', 'unsold', null
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [actionMenuId, setActionMenuId] = useState(null);
    const [showTicketsModal, setShowTicketsModal] = useState(false);
    const [modalTickets, setModalTickets] = useState([]);
    const [expandedSeries, setExpandedSeries] = useState({});
    const [pickedTicketsData, setPickedTicketsData] = useState(null); // Store full picked data
    const [seriesExpanded, setSeriesExpanded] = useState(false); // For expand/collapse in modal

    // Get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken')
            || localStorage.getItem('access_token')
            || localStorage.getItem('token')
            || localStorage.getItem('auth_token');

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    };

    // Handle 401 errors
    const handleUnauthorized = (response) => {
        if (response.status === 401) {
            Swal.fire('Session Expired', 'Please login again.', 'warning');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return true;
        }
        return false;
    };

    // Fetch support data on mount
    useEffect(() => {
        fetchSupportData();
    }, []);

    // Load jsPDF library dynamically
    useEffect(() => {
        if (!window.jspdf) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    const fetchSupportData = async () => {
        try {
            setLoading(true);
            const res = await fetch(SUPPORT_DATA_URL, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (handleUnauthorized(res)) return;

            const result = await res.json();

            if (result.status === 'success') {
                // Map the real data structure to our state
                const mappedAwards = result.data.draw_list.map(award => ({
                    ...award,
                    tickets: award.award_dtl || null // award_dtl is the array of tickets
                }));
                setAwards(mappedAwards);
            } else {
                throw new Error(result.message?.[0] || 'Failed to fetch awards');
            }
        } catch (error) {
            console.error('Error fetching support data:', error);
            Swal.fire('Error', 'Failed to load support data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGrantAward = () => {
        resetModal();
        setShowGrantModal(true);
    };

    const resetModal = () => {
        setSelectedAward(null);
        setTicketNumber('');
        setTicketStatus(null);
        setCheckingStatus(false);
        setConfirming(false);
    };

    const checkTicketStatus = async () => {
        if (!ticketNumber) return;
        try {
            setCheckingStatus(true);
            const res = await fetch(CHECK_TICKET_URL, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ ticket_no: ticketNumber })
            });

            if (handleUnauthorized(res)) return;

            const result = await res.json();
            const primaryMessage = Array.isArray(result.message) ? result.message[0] : (result.message || '');
            const boldTicketHtml = `<strong>${ticketNumber}</strong>`;

            if (result.status === 'success' && result.data?.is_sold === 1) {
                setTicketStatus('sold');
                Swal.fire({
                    title: 'Sold!',
                    html: `Ticket ${boldTicketHtml} is SOLD`,
                    icon: 'success',
                    confirmButtonColor: '#28a745'
                });
            } else if (result.status === 'error') {
                // Handle distinct backend error messages
                const msg = primaryMessage.toLowerCase();

                if (msg.includes('already awarded')) {
                    // Ticket is already awarded
                    setTicketStatus('unsold');
                    Swal.fire({
                        title: 'Already Awarded',
                        html: `Ticket ${boldTicketHtml} is already awarded.`,
                        icon: 'warning',
                        confirmButtonColor: '#f59e0b'
                    });
                } else if (msg.includes('not sold')) {
                    // Real unsold response from backend
                    setTicketStatus('unsold');
                    Swal.fire({
                        title: 'Unsold',
                        html: `Ticket ${boldTicketHtml} is UNSOLD`,
                        icon: 'error',
                        confirmButtonColor: '#dc3545'
                    });
                } else {
                    // Fallback for any other error message
                    setTicketStatus('unsold');
                    Swal.fire('Error', primaryMessage || 'Failed to check ticket status', 'error');
                }
            } else {
                // Fallback when response shape is unexpected – treat as unsold/invalid
                setTicketStatus('unsold');
                Swal.fire({
                    title: 'Unsold',
                    html: `Ticket ${boldTicketHtml} is UNSOLD`,
                    icon: 'error',
                    confirmButtonColor: '#dc3545'
                });
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to check ticket status', 'error');
        } finally {
            setCheckingStatus(false);
        }
    };

    const handlePickTickets = async () => {
        if (!selectedAward) return;
        try {
            setCheckingStatus(true);
            const res = await fetch(PICK_TICKETS_URL, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    award_id: selectedAward.id
                })
            });

            if (handleUnauthorized(res)) return;

            if (res.status === 404) {
                setCheckingStatus(false);
                Swal.fire('Error', 'No tickets found for this award or award ID is invalid.', 'error');
                return;
            }

            const result = await res.json();

            if (result.status === 'success') {
                // Store the full picked tickets data
                setPickedTicketsData(result.data);
                // Set tickets array for confirmation
                setModalTickets(result.data.tickets || []);
                setTicketStatus('sold');
            } else {
                throw new Error(result.message?.[0] || 'Failed to pick tickets');
            }
            setCheckingStatus(false);
        } catch (error) {
            setCheckingStatus(false);
            Swal.fire('Error', 'Failed to pick tickets', 'error');
        }
    };

    const handleConfirm = async () => {
        if (!hasPermission('grant award assign')) {
            Swal.fire('Restricted', 'You do not have permission to assign awards', 'warning');
            return;
        }

        const result = await Swal.fire({
            title: 'Confirm Assignment',
            text: 'Do you want to proceed?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, proceed',
            cancelButtonText: 'No'
        });

        if (result.isConfirmed) {
            try {
                setConfirming(true);

                // Format tickets as indexed array for backend
                const ticketsToSend = selectedAward.is_single ? [ticketNumber] : modalTickets;
                const formData = new FormData();
                formData.append('award_id', selectedAward.id);
                ticketsToSend.forEach((ticket, index) => {
                    formData.append(`tickets[${index}]`, ticket);
                });

                const res = await fetch(CONFIRM_AWARD_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': getAuthHeaders()['Authorization'],
                        'Accept': 'application/json'
                    },
                    body: formData
                });

                if (handleUnauthorized(res)) return;

                const result = await res.json();

                if (result.status === 'success') {
                    // Refresh the support data to get updated award list
                    await fetchSupportData();
                    setConfirming(false);
                    setShowGrantModal(false);
                    Swal.fire('Success', result.message?.[0] || 'Award granted successfully', 'success');
                } else {
                    throw new Error(result.message?.[0] || 'Failed to confirm award');
                }
            } catch (error) {
                setConfirming(false);
                Swal.fire('Error', 'Failed to confirm award', 'error');
            }
        }
    };

    const handlePrintAll = () => {
        const awardedItems = awards.filter(a => a.is_awarded === 1);

        if (awardedItems.length === 0) {
            Swal.fire('No Awards', 'No awards have been granted yet.', 'info');
            return;
        }

        if (!window.jspdf) {
            Swal.fire('Error', 'PDF library is still loading. Please try again in a moment.', 'error');
            return;
        }

        const { jsPDF } = window.jspdf;

        awardedItems.forEach(award => {
            generateAwardPDF(award, jsPDF);
        });

        Swal.fire('Success', `Generated ${awardedItems.length} award PDF(s)`, 'success');
    };

    const handlePrintRow = (award) => {
        if (!award.is_awarded || !award.tickets) {
            Swal.fire('Not Awarded', 'This award has not been granted yet.', 'info');
            return;
        }

        if (!window.jspdf) {
            Swal.fire('Error', 'PDF library is still loading. Please try again in a moment.', 'error');
            return;
        }

        const { jsPDF } = window.jspdf;
        generateAwardPDF(award, jsPDF);
    };

    const generateAwardPDF = (award, jsPDF) => {
        const ticketsArray = award.tickets || [];
        const HEADER_HEIGHT = 75;
        const TICKET_ROW_HEIGHT = 10; // Increased for customer details
        const BOTTOM_MARGIN = 25;

        const pageWidth = 210;
        const pageHeight = 297;

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        // Background
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        const generatedTime = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        const drawPageDecoration = (docRef) => {
            // Top accent band
            docRef.setFillColor(16, 185, 129);
            docRef.rect(10, 10, pageWidth - 20, 20, 'F');
            docRef.setFillColor(59, 130, 246);
            docRef.rect(10, 30, pageWidth - 20, 2, 'F');

            // Logo (transparent PNG)
            try {
                docRef.addImage(headerLogo, 'PNG', 14, 12, 26, 16);
            } catch { }

            // Header text
            docRef.setFontSize(12);
            docRef.setFont(undefined, 'bold');
            docRef.setTextColor(255, 255, 255);
            docRef.text('Bangladesh Thalassaemia Samity (BTS)', 52, 22);

            docRef.setFontSize(10);
            docRef.setTextColor(229, 231, 235);
            docRef.text('Lottery 2025 (Govt. Approved) · Award Management', 52, 28);

            docRef.setFontSize(7);
            docRef.setTextColor(120, 120, 120);
            docRef.text(`Generated at: ${generatedTime}`, 15, 42);

            docRef.setDrawColor(209, 213, 219);
            docRef.line(15, 47, pageWidth - 15, 47);
        };

        const addNewPage = (docRef) => {
            docRef.addPage();
            drawPageDecoration(docRef);
            return 55; // Start yPos after header on new page
        };

        drawPageDecoration(doc);

        // Award Information
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        // Award and Total Tickets in same row
        doc.setFont(undefined, 'normal');
        doc.text('Award:', 15, 54);
        doc.setFont(undefined, 'bold');
        doc.text(award.title || 'N/A', 35, 54);

        const totalTicketsText = `Total Tickets: ${ticketsArray.length}`;
        const totalTicketsWidth = doc.getTextWidth(totalTicketsText);
        doc.setFont(undefined, 'bold');
        doc.text(totalTicketsText, pageWidth - 15 - totalTicketsWidth, 54);

        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('AWARDED TICKET DETAILS', 15, 68);
        doc.line(15, 70, pageWidth - 15, 70);

        // Group tickets by numeric serial (e.g. 0527491)
        const serialGroups = {};
        ticketsArray.forEach(ticket => {
            const ticketNo = typeof ticket === 'object' ? ticket.ticket_no : ticket;
            const serialMatch = ticketNo.match(/\d+/);
            const serial = serialMatch ? serialMatch[0] : 'Other';

            if (!serialGroups[serial]) {
                serialGroups[serial] = [];
            }
            serialGroups[serial].push(ticketNo);
        });

        let yPos = 78;
        doc.setFontSize(8);

        Object.keys(serialGroups).sort().forEach((serial) => {
            const tickets = serialGroups[serial];

            if (yPos > pageHeight - 20) {
                yPos = addNewPage(doc);
            }

            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(`Serial: ${serial} (${tickets.length} tickets)`, 15, yPos);
            yPos += 5;

            doc.setFont(undefined, 'normal');
            doc.setTextColor(50, 50, 50);

            const ticketsText = tickets.join(', ');
            const splitTickets = doc.splitTextToSize(ticketsText, pageWidth - 30);

            splitTickets.forEach(line => {
                if (yPos > pageHeight - 15) {
                    yPos = addNewPage(doc);
                }
                doc.text(line, 20, yPos);
                yPos += 4;
            });

            yPos += 2;
        });

        const fileName = `award-${award.title.replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`;
        doc.save(fileName);
    };

    const openTicketsModal = (award) => {
        if (!award.tickets) return;
        setModalTickets(award.tickets);
        setShowTicketsModal(true);
    };

    const toggleSeries = (serie) => {
        setExpandedSeries(prev => ({ ...prev, [serie]: !prev[serie] }));
    };

    const renderTicketList = () => {
        // Extract ticket numbers from objects or use strings directly
        const ticketNumbers = modalTickets.map(t =>
            typeof t === 'object' ? t.ticket_no : t
        );

        if (ticketNumbers.length <= 10) {
            return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {ticketNumbers.map((t, i) => (
                        <span key={i} className="badge bg-primary" style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', borderRadius: '4px', fontSize: '12px' }}>{t}</span>
                    ))}
                </div>
            );
        }

        // Group by numeric serial (e.g. 0527491)
        const groups = {};
        ticketNumbers.forEach(t => {
            const serialMatch = t.match(/\d+/);
            const serial = serialMatch ? serialMatch[0] : 'Other';
            if (!groups[serial]) groups[serial] = [];
            groups[serial].push(t);
        });

        return (
            <div>
                {Object.keys(groups).sort().map(serial => (
                    <div key={serial} style={{ marginBottom: '10px' }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: '#f8f9fa',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                border: '1px solid #eee'
                            }}
                            onClick={() => toggleSeries(serial)}
                        >
                            <span style={{ fontWeight: 600 }}>Serial: {serial} ({groups[serial].length} records)</span>
                            <span>{expandedSeries[serial] ? '−' : '+'}</span>
                        </div>
                        {expandedSeries[serial] && (
                            <div style={{ padding: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px', backgroundColor: '#fff', border: '1px solid #f0f0f0', borderTop: 'none' }}>
                                {groups[serial].map((t, i) => (
                                    <span key={i} style={{ fontSize: '11px', padding: '2px 5px', border: '1px solid #ddd', borderRadius: '3px' }}>{t}</span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div style={{ padding: '16px', backgroundColor: '#F5F5F5', minHeight: '100vh' }}>
            <style>{`
                .grant-award-shell{
                    max-width: 1180px;
                    margin: 0 auto;
                }

                .brand-hero{
                    background:
                        radial-gradient(1200px 500px at 10% 0%, rgba(16,185,129,0.18), rgba(16,185,129,0) 55%),
                        radial-gradient(1200px 500px at 90% 0%, rgba(59,130,246,0.18), rgba(59,130,246,0) 55%),
                        linear-gradient(180deg, #ffffff 0%, #fbfbfb 100%);
                    border: 1px solid rgba(0,0,0,0.06);
                    border-radius: 14px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.06);
                    padding: 16px 16px;
                    margin-top: 40px;
                    margin-bottom: 12px;
                    position: relative;
                    overflow: hidden;
                }

                .brand-hero::after{
                    content: "";
                    position: absolute;
                    inset: -2px;
                    border-radius: 14px;
                    background: linear-gradient(90deg, rgba(16,185,129,0.35), rgba(59,130,246,0.35));
                    opacity: 0.20;
                    filter: blur(18px);
                    pointer-events: none;
                }

                .brand-hero-inner{
                    position: relative;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 14px;
                    flex-wrap: wrap;
                }

                .brand-left{
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 240px;
                }

                .brand-logo-wrap{
                    // width: 80px;
                    // height: 80px;
                    border-radius: 20px;
                    background: transparent;
                    border: none;
                    box-shadow: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex: 0 0 auto;
                }

                .brand-logo{
                    width: 100px;
                    height: 100px;
                    object-fit: contain;
                }

                .brand-title{
                    margin: 0;
                    font-size: 18px;
                    font-weight: 800;
                    color: #111827;
                    line-height: 1.15;
                }

                .brand-subtitle{
                    margin: 4px 0 0 0;
                    font-size: 12px;
                    color: #4b5563;
                    font-weight: 500;
                }

                .brand-right{
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 7px;
                    flex-wrap: nowrap;
                    margin-top: 6px;
                }
                .page-header h1 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                    white-space: nowrap;
                }
                .page-header .breadcrumb-nav {
                    font-size: 13px;
                    color: #555;
                    display: flex;
                    align-items: center;
                    white-space: nowrap;
                }
                .breadcrumb-nav span { cursor: pointer; transition: color 0.2s; }
                .breadcrumb-nav span:hover { color: blue; }
                
                @media (max-width: 483px) {
                    .page-header h1 { font-size: 14px; }
                    .page-header .breadcrumb-nav { font-size: 10px; }
                    .page-header .breadcrumb-nav .home-icon { font-size: 10px !important; }
                    .page-header .breadcrumb-nav .separator { margin: 0 4px !important; }
                }

                .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 10px; }
                
                .btn-grant { 
                    padding: 8px 16px; 
                    border-radius: 10px; 
                    background: linear-gradient(90deg, #10b981, #059669); 
                    color: white; 
                    border: none; 
                    cursor: pointer; 
                    fontSize: 12px; 
                    boxShadow: 0 1px 2px rgba(0,0,0,0.15); 
                    display: inline-flex; 
                    align-items: center;
                    gap: 6px;
                }
                .btn-print-all { 
                    padding: 8px 16px; 
                    border-radius: 10px; 
                    background: linear-gradient(90deg, #111827, #374151); 
                    color: white; 
                    border: none; 
                    cursor: pointer; 
                    fontSize: 12px; 
                    boxShadow: 0 1px 2px rgba(0,0,0,0.15); 
                    display: inline-flex; 
                    align-items: center;
                    gap: 6px;
                }

                .btn-soft{
                    padding: 8px 14px;
                    border-radius: 10px;
                    border: 1px solid rgba(0,0,0,0.08);
                    background: rgba(255,255,255,0.9);
                    color: #111827;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 700;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    transition: transform .12s ease, box-shadow .12s ease;
                }
                .btn-soft:hover{ transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }

                .award-modal-overlay { 
                    position: fixed; 
                    top: 0; 
                    left: 0; 
                    right: 0; 
                    bottom: 0; 
                    background: rgba(0,0,0,0.5); 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    z-index: 1050; 
                    padding: 20px;
                }
                .award-modal { 
                    background: white; 
                    border-radius: 12px; 
                    width: 800px; 
                    max-width: 95%; 
                    max-height: 90vh; 
                    overflow-y: auto; 
                    padding: 30px; 
                    position: relative; 
                    box-shadow: 0 15px 50px rgba(0,0,0,0.3);
                    transition: all 0.3s ease;
                    scrollbar-width: thin;
                    scrollbar-color: #ccc transparent;
                }
                .award-modal::-webkit-scrollbar {
                    width: 6px;
                }
                .award-modal::-webkit-scrollbar-thumb {
                    background-color: #ccc;
                    border-radius: 10px;
                }
                .form-group { margin-bottom: 16px; }
                .form-label { display: block; margin-bottom: 4px; font-weight: 500; color: #333; font-size: 13px; }
                .status-sold { color: #28a745; display: flex; align-items: center; gap: 5px; font-weight: 600; margin-top: 10px; font-size: 13px; }
                .status-unsold { color: #dc3545; display: flex; align-items: center; gap: 5px; font-weight: 600; margin-top: 10px; font-size: 13px; }
                .action-btns { display: flex; gap: 10px; margin-top: 20px; }
                .btn-confirm { flex: 1; background-color: #28a745; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 12px; }
                .btn-recheck { flex: 1; background-color: #ffc107; color: #212529; border: none; padding: 10px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 12px; }
                .btn-confirm:disabled { background-color: #6c757d; cursor: not-allowed; opacity: 0.6; }
                .form-control:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 2px rgba(0,123,255,0.25); }

                .table-title{
                    margin: 0;
                    font-size: 14px;
                    font-weight: 800;
                    color: #111827;
                }
                .table-subtitle{
                    margin: 4px 0 0 0;
                    font-size: 12px;
                    color: #6b7280;
                }

                .card-elevated{
                    border: 1px solid rgba(0,0,0,0.06);
                    border-radius: 14px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.06);
                }

                /* SweetAlert icon sizing tweaks */
                .swal2-icon.swal2-success,
                .swal2-icon.swal2-error,
                .swal2-icon.swal2-warning {
                    transform: scale(0.8);
                    margin-top: 0;
                }
            `}</style>

            <div className="grant-award-shell">
                {/* Branded Hero (public-friendly) */}
                <div className="brand-hero">
                    <div className="brand-hero-inner">
                        <div className="brand-left">
                            <div className="brand-logo-wrap" aria-hidden="true">
                                <img className="brand-logo" src={headerLogo} alt="BTS logo" />
                            </div>
                            <div>
                                <p className="brand-title">Bangladesh Thalassaemia Samity (BTS)</p>
                                <p className="brand-subtitle">Lottery 2025 (Govt. Approved) · Award Management</p>
                            </div>
                        </div>

                        {/* Action Buttons Section */}
                        <div className="brand-right">
                            {hasPermission('grant award assign') && (
                                <button onClick={handleGrantAward} className="btn-grant" type="button">
                                    <i className="fa-solid fa-plus" style={{ fontSize: '12px' }}></i>
                                    Award Management
                                </button>
                            )}
                            <button onClick={handlePrintAll} className="btn-print-all" type="button">
                                <FaPrint style={{ fontSize: '12px' }} />
                                Print All
                            </button>
                        </div>
                    </div>
                </div>

                {/* Header with Section Title */}
                <div className='page-header'>
                    <h1>Award Management</h1>
                </div>

                {/* Card Container */}
                <div className='mt-3 card-elevated' style={{
                    backgroundColor: 'white',
                    borderRadius: '14px',
                    padding: '12px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                        marginBottom: '10px',
                        padding: '6px 6px 10px 6px',
                        borderBottom: '1px solid rgba(0,0,0,0.06)'
                    }}>
                        <div>
                            <p className="table-title">Award List</p>
                            <p className="table-subtitle">View awarded tickets and generate PDF printouts.</p>
                        </div>
                    </div>

                    {hasPermission('grant award list') ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table
                                className="table table-bordered table-hover table-sm align-middle"
                                style={{ fontSize: "12px", lineHeight: "1.8", minWidth: '100%' }}
                            >
                                <thead className="table-light">
                                    <tr>
                                        <th className="py-2 px-3 fw-semibold text-center" style={{ width: "60px" }}>S/N</th>
                                        <th className="py-2 px-3 fw-semibold text-start">Award Title</th>
                                        <th className="py-2 px-3 fw-semibold text-start">Ticket Numbers</th>
                                        <th className="py-2 px-3 fw-semibold text-center" style={{ width: "100px" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <SkeletonLoader type="table" count={5} columns={4} />
                                    ) : awards.length > 0 ? (
                                        awards.map((award, index) => (
                                            <tr key={award.id} className="align-middle">
                                                <td className="py-1 px-3 text-center">{index + 1}</td>
                                                <td className="py-1 px-3 text-start">{award.title}</td>
                                                <td className="py-1 px-3 text-start">
                                                    {!award.tickets || award.tickets.length === 0 ? (
                                                        <span style={{ color: '#999' }}>-</span>
                                                    ) : (
                                                        <div
                                                            style={{ cursor: 'pointer', color: '#2563eb', fontWeight: 700 }}
                                                            onClick={() => openTicketsModal(award)}
                                                        >
                                                            {award.is_single
                                                                ? (typeof award.tickets[0] === 'object' ? award.tickets[0].ticket_no : award.tickets[0])
                                                                : `View ${award.tickets.length} tickets`}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-1 px-3 text-center">
                                                    <div style={{ position: 'relative' }}>
                                                        <button
                                                            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '5px' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActionMenuId(actionMenuId === award.id ? null : award.id);
                                                            }}
                                                        >
                                                            <FaEllipsisV style={{ fontSize: '14px', color: '#666' }} />
                                                        </button>
                                                        {actionMenuId === award.id && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                right: '25px',
                                                                top: '0',
                                                                backgroundColor: 'white',
                                                                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                                                                borderRadius: '10px',
                                                                zIndex: 100,
                                                                width: '140px',
                                                                border: '1px solid rgba(0,0,0,0.08)',
                                                                overflow: 'hidden'
                                                            }}>
                                                                <button
                                                                    style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#111827', fontWeight: 700 }}
                                                                    onClick={() => {
                                                                        handlePrintRow(award);
                                                                        setActionMenuId(null);
                                                                    }}
                                                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                                                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                                                >
                                                                    <i className="fa-solid fa-file-pdf" style={{ marginRight: '8px' }}></i>
                                                                    PDF Print
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-4 text-muted">
                                                No awards granted yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                            <i className="fa-solid fa-lock" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
                            <p>You do not have permission to view the award list.</p>
                        </div>
                    )}
                </div>

                {/* Grant Award Modal */}
                {showGrantModal && (
                    <div className="award-modal-overlay" onClick={() => setShowGrantModal(false)}>
                        <div className="award-modal" onClick={e => e.stopPropagation()}>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr auto 1fr',
                                    alignItems: 'center',
                                    marginBottom: '18px',
                                    columnGap: '12px'
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <h3 style={{ margin: 0, fontWeight: 900, color: '#111827', fontSize: '18px' }}>Grant Award</h3>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Verify ticket(s) and confirm assignment.</div>
                                </div>
                                <div
                                    className="brand-logo-wrap"
                                    style={{
                                        // width: '80px',
                                        // height: '80px',
                                        borderRadius: '18px',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        display: 'flex',
                                        margin: '0 auto'
                                    }}
                                    aria-hidden="true"
                                >
                                    <img
                                        className="brand-logo"
                                        style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                                        src={headerLogo}
                                        alt="BTS logo"
                                    />
                                </div>
                                <button
                                    style={{
                                        border: 'none',
                                        background: 'none',
                                        fontSize: '24px',
                                        cursor: 'pointer',
                                        color: '#999',
                                        justifySelf: 'end'
                                    }}
                                    onClick={() => setShowGrantModal(false)}
                                >
                                    ×
                                </button>
                            </div>

                        <div className="form-group">
                            <label className="form-label">Select Award</label>
                            <Select
                                options={awards.map(a => ({ value: a.id, label: a.title, ...a }))}
                                isOptionDisabled={(option) => option.is_awarded === 1}
                                onChange={(opt) => {
                                    setSelectedAward(opt);
                                    setTicketStatus(null);
                                    setTicketNumber('');
                                }}
                                placeholder="Choose an award..."
                                styles={{
                                    control: (base) => ({ ...base, minHeight: '40px' }),
                                    menu: (base) => ({
                                        ...base,
                                        position: 'relative',
                                        boxShadow: 'none',
                                        border: '1px solid #ccc',
                                        marginTop: '0'
                                    }),
                                    menuList: (base) => ({ ...base, maxHeight: 'none' }), // Removing internal scroll
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isDisabled ? '#f8f9fa' : base.backgroundColor,
                                        color: state.isDisabled ? '#ccc' : base.color
                                    })
                                }}
                            />
                        </div>

                        {selectedAward && (
                            <>
                                {selectedAward.is_single === 1 ? (
                                    <div className="form-group">
                                        <label className="form-label">Ticket Number</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                value={ticketNumber}
                                                onChange={(e) => {
                                                    setTicketNumber(e.target.value);
                                                    setTicketStatus(null);
                                                }}
                                                placeholder="Enter ticket number"
                                            />
                                            <button
                                                className="btn-grant"
                                                style={{ padding: '0 20px' }}
                                                onClick={checkTicketStatus}
                                                disabled={checkingStatus}
                                            >
                                                {checkingStatus ? 'Checking...' : 'Check'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="form-group" style={{ textAlign: 'center', marginTop: '20px' }}>
                                        <button
                                            className="btn-grant"
                                            style={{ width: '100%', justifyContent: 'center', height: '45px' }}
                                            onClick={handlePickTickets}
                                            disabled={checkingStatus}
                                        >
                                            {checkingStatus ? 'Picking...' : `Pick tickets for ${selectedAward.title}`}
                                        </button>
                                    </div>
                                )}

                                {ticketStatus === 'sold' && (
                                    <div className="status-sold">
                                        <FaCheckCircle /> Sold - Verified
                                    </div>
                                )}
                                {ticketStatus === 'unsold' && (
                                    <div className="status-unsold">
                                        <FaExclamationCircle /> Unsold - Invalid for Award
                                    </div>
                                )}

                                {ticketStatus === 'sold' && !selectedAward.is_single && pickedTicketsData && (
                                    <div className="form-group" style={{ marginTop: '20px' }}>
                                        <label className="form-label">Picked Tickets</label>
                                        {pickedTicketsData.series && pickedTicketsData.series.length > 0 ? (
                                            <div>
                                                {pickedTicketsData.series.map((seriesItem, index) => (
                                                    <div key={index} style={{ marginBottom: '10px', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '10px' }}>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={() => setSeriesExpanded(!seriesExpanded)}
                                                        >
                                                            <div>
                                                                <strong>Serial: {seriesItem.serial}</strong>
                                                                <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>({seriesItem.total} tickets)</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    fontSize: '18px',
                                                                    color: '#007bff'
                                                                }}
                                                            >
                                                                {seriesExpanded ? '−' : '+'}
                                                            </button>
                                                        </div>
                                                        {seriesExpanded && (
                                                            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e0e0e0' }}>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                                    {seriesItem.ticket_nos.split(',').map((ticket, idx) => (
                                                                        <span
                                                                            key={idx}
                                                                            style={{
                                                                                padding: '4px 8px',
                                                                                backgroundColor: '#007bff',
                                                                                color: 'white',
                                                                                borderRadius: '3px',
                                                                                fontSize: '11px'
                                                                            }}
                                                                        >
                                                                            {ticket}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '13px', color: '#666' }}>
                                                No tickets picked yet
                                            </div>
                                        )}
                                    </div>
                                )}

                                {ticketStatus !== null && (
                                    <div className="action-btns">
                                        <button className="btn-recheck" onClick={() => {
                                            setTicketStatus(null);
                                            setTicketNumber('');
                                            setPickedTicketsData(null);
                                            setSeriesExpanded(false);
                                        }}>
                                            Recheck
                                        </button>
                                        <button
                                            className="btn-confirm"
                                            disabled={ticketStatus !== 'sold' || confirming}
                                            onClick={handleConfirm}
                                        >
                                            {confirming ? 'Processing...' : 'Confirm'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                        </div>
                    </div>
                )}

                {/* Tickets Display Modal */}
                {showTicketsModal && (
                    <div className="award-modal-overlay" onClick={() => setShowTicketsModal(false)}>
                        <div className="award-modal" style={{ width: '640px' }} onClick={e => e.stopPropagation()}>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr auto 1fr',
                                    alignItems: 'center',
                                    marginBottom: '18px',
                                    columnGap: '12px'
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <h3 style={{ margin: 0, fontWeight: 900, color: '#111827', fontSize: '18px' }}>Awarded Tickets</h3>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Grouped view for quick on-stage reading.</div>
                                </div>
                                <div
                                    className="brand-logo-wrap"
                                    style={{
                                        // width: '80px',
                                        // height: '80px',
                                        borderRadius: '18px',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        display: 'flex',
                                        margin: '0 auto'
                                    }}
                                    aria-hidden="true"
                                >
                                    <img
                                        className="brand-logo"
                                        style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                                        src={headerLogo}
                                        alt="BTS logo"
                                    />
                                </div>
                                <button
                                    style={{
                                        border: 'none',
                                        background: 'none',
                                        fontSize: '24px',
                                        cursor: 'pointer',
                                        color: '#999',
                                        justifySelf: 'end'
                                    }}
                                    onClick={() => setShowTicketsModal(false)}
                                >
                                    ×
                                </button>
                            </div>
                            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
                                {renderTicketList()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GrantAwardPage;