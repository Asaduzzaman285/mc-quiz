// PurchaseLogPage.jsx
import React, { useState, useEffect } from 'react';
import Paginate from './Paginate';
import { FaHome } from 'react-icons/fa';
import { BsTelephonePlus } from "react-icons/bs";
import { FaPerson, FaLocationDot } from "react-icons/fa6";
import SkeletonLoader from './SkeletonLoader';
import Swal from "sweetalert2";
import { hasPermission } from '../utils/permissions';

import headerLogo from "/assets/headerlogo_1.png"

const BASE_URL = `${import.meta.env.VITE_APP_API_BASE_URL}/api/v1/purchase-log`;

const PurchaseLogPage = ({ sidebarVisible = false }) => {
    const [reports, setReports] = useState([]);
    const [searchTicketNumbers, setSearchTicketNumbers] = useState('');
    const [searchMerchant, setSearchMerchant] = useState('');
    const [searchDateFrom, setSearchDateFrom] = useState('');
    const [searchDateTo, setSearchDateTo] = useState('');
    const [searchCustomerMobile, setSearchCustomerMobile] = useState('');
    const [searchMerchantTransactionId, setSearchMerchantTransactionId] = useState('');
    const [searchStatus, setSearchStatus] = useState('');
    const [searchEpsTransactionId, setSearchEpsTransactionId] = useState('');
    const [searchRequestId, setSearchRequestId] = useState('');
    const [searchOrderId, setSearchOrderId] = useState('');
    const [searchPaymentGatewayId, setSearchPaymentGatewayId] = useState('');
    const [paymentGateways, setPaymentGateways] = useState([]);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertVariant, setAlertVariant] = useState('success');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [actionMenuId, setActionMenuId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedTickets, setSelectedTickets] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedReportForAssign, setSelectedReportForAssign] = useState(null);
    const [assignForm, setAssignForm] = useState({
        eps_transaction_id: '',
        transaction_type: 'Purchase',
        financial_entity: 'Bkash'
    });
    const [assignLoading, setAssignLoading] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState({
        ticket_numbers: '',
        merchant: '',
        start_time: '',
        end_time: '',
        customer_mobile: '',
        status: '',
        merchant_transaction_id: '',
        eps_transaction_id: '',
        request_id: '',
        order_id: '',
        payment_gateway_id: ''
    });
    const [paginator, setPaginator] = useState({
        current_page: 1,
        total_pages: 1,
        previous_page_url: null,
        next_page_url: null,
        record_per_page: 10,
        current_page_items_count: 0,
        total_count: 0,
        pagination_last_page: 1
    });

    // Load jsPDF library
    useEffect(() => {
        if (!window.jspdf) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    // New function to handle ticket assignment
    const handleAssignTicketClick = (report) => {
        setActionMenuId(null);
        setSelectedReportForAssign(report);
        setAssignForm({
            eps_transaction_id: '',
            transaction_type: 'Purchase',
            financial_entity: 'Bkash'
        });
        setShowAssignModal(true);
    };

    // Function to submit ticket assignment
    const handleAssignTicketSubmit = async () => {
        if (!selectedReportForAssign) return;

        try {
            setAssignLoading(true);

            const response = await fetch(`${BASE_URL}/asign-ticket-to-customer`, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    id: selectedReportForAssign.id,
                    eps_transaction_id: assignForm.eps_transaction_id,
                    transaction_type: assignForm.transaction_type,
                    financial_entity: assignForm.financial_entity
                })
            });

            if (handleUnauthorized(response)) return;

            if (!response.ok) {
                throw new Error('Failed to assign ticket');
            }

            const result = await response.json();

            if (result.status === 'success') {
                Toast.fire({
                    icon: 'success',
                    title: 'Ticket assigned successfully and a sms also has been sent.',
                    timer: 5000,
                    timerProgressBar: true
                });

                // Refresh the current page to show updated data
                fetchReports(currentPage);
                setShowAssignModal(false);
                setSelectedReportForAssign(null);
                setAssignForm({
                    eps_transaction_id: '',
                    transaction_type: '',
                    financial_entity: ''
                });
            } else {
                throw new Error(result.message || 'Failed to assign ticket');
            }
        } catch (error) {
            console.error('Error assigning ticket:', error);
            Toast.fire({
                icon: 'error',
                title: error.message || 'Failed to assign ticket'
            });
        } finally {
            setAssignLoading(false);
        }
    };

    const confirmAndSendSms = (report) => {
        if (!report.ticket_numbers) return;

        Swal.fire({
            title: 'Are you sure?',
            text: "Do you want to send SMS for this report?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, send it!',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                handleSendSms(report);
                Swal.fire('Sent!', 'The SMS has been sent.', 'success');
            }
        });
    };

    const handleDateChange = (setter) => (e) => {
        setter(e.target.value);
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
    };

    const formatBDT = (number) => {
        const num = Math.round(Number(number));
        if (Number.isNaN(num)) return '0';
        return num.toLocaleString('en-IN');
    };

    const statusOptions = {
        'success': { label: 'Success', color: '#28a745', bg: '#d4edda' },
        'requested': { label: 'Requested', color: '#ffc107', bg: '#fff3cd' }
    };

    const getAuthHeaders = () => {
        let token = localStorage.getItem('authToken')
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

    const handleUnauthorized = (response) => {
        if (response.status === 401) {
            showAlert('Session expired. Please login again.', 'danger');
            setTimeout(() => {
                // window.location.href = '/login';
            }, 2000);
            return true;
        }
        return false;
    };

    useEffect(() => {
        fetchReports(1);
        fetchSupportData();
    }, []);

    const fetchSupportData = async () => {
        try {
            const response = await fetch(`${BASE_URL}/support-data`, {
                method: 'GET',
                headers: getAuthHeaders(),
                credentials: 'include',
            });
            if (handleUnauthorized(response)) return;
            const result = await response.json();
            if (result.status === 'success') {
                setPaymentGateways(result.data.payment_gateway_list || []);
            }
        } catch (error) {
            console.error('Error fetching support data:', error);
        }
    };

    useEffect(() => {
        const handleClickOutside = () => setActionMenuId(null);
        if (actionMenuId !== null) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [actionMenuId]);

    const formatDisplayDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return '';
        const [date, time] = dateTimeStr.split(' ');
        const [year, month, day] = date.split('-');
        return `${day}-${month}-${year} ${time}`;
    };

    const fetchReports = async (page = 1, filters = null) => {
        try {
            setLoading(true);

            const queryParams = new URLSearchParams();
            queryParams.append('page', page);

            const activeFilters = filters || appliedFilters;

            if (activeFilters.ticket_numbers) queryParams.append('ticket_numbers', activeFilters.ticket_numbers);
            if (activeFilters.merchant) queryParams.append('merchant', activeFilters.merchant);
            if (activeFilters.customer_mobile) queryParams.append('customer_mobile', activeFilters.customer_mobile);
            if (activeFilters.merchant_transaction_id) queryParams.append('merchant_transaction_id', activeFilters.merchant_transaction_id);
            if (activeFilters.eps_transaction_id) queryParams.append('eps_transaction_id', activeFilters.eps_transaction_id);
            if (activeFilters.request_id) queryParams.append('request_id', activeFilters.request_id);
            if (activeFilters.order_id) queryParams.append('order_id', activeFilters.order_id);
            if (activeFilters.start_time) queryParams.append('start_time', activeFilters.start_time);
            if (activeFilters.status)
                queryParams.append('status', activeFilters.status);
            if (activeFilters.payment_gateway_id)
                queryParams.append('payment_gateway_id', activeFilters.payment_gateway_id);

            if (activeFilters.end_time) queryParams.append('end_time', activeFilters.end_time);

            const queryString = queryParams.toString();
            const url = `${BASE_URL}/list-paginate?${queryString}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (handleUnauthorized(response)) return;

            if (!response.ok) {
                throw new Error(`Failed to fetch reports: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            if (result.status === 'success') {
                const reportsData = result?.data?.data ?? [];
                setReports(reportsData);
                setCurrentPage(page);

                if (result.data?.paginator) {
                    setPaginator(result.data.paginator);
                } else {
                    setPaginator(prev => ({
                        ...prev,
                        current_page: page,
                        total_count: reportsData.length,
                        current_page_items_count: reportsData.length
                    }));
                }
            } else {
                throw new Error(result.message || 'Failed to fetch reports');
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            showAlert(error.message || "Failed to fetch reports", "danger");
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setSearchTicketNumbers('');
        setSearchMerchant('');
        setSearchDateFrom('');
        setSearchDateTo('');
        setSearchCustomerMobile('');
        setSearchMerchantTransactionId('');
        setSearchEpsTransactionId('');
        setSearchRequestId('');
        setSearchOrderId('');
        setSearchStatus('');
        setSearchPaymentGatewayId('');

        const emptyFilters = {
            ticket_numbers: '',
            merchant: '',
            start_time: '',
            end_time: '',
            customer_mobile: '',
            merchant_transaction_id: '',
            eps_transaction_id: '',
            request_id: '',
            order_id: '',
            status: '',
            payment_gateway_id: ''
        };

        setAppliedFilters(emptyFilters);
        setCurrentPage(1);
        fetchReports(1, emptyFilters);
    };

    const handleFilter = () => {
        const filters = {
            ticket_numbers: searchTicketNumbers,
            merchant: searchMerchant,
            start_time: searchDateFrom ? `${searchDateFrom} 00:00:00` : '',
            end_time: searchDateTo ? `${searchDateTo} 23:59:59` : '',
            customer_mobile: searchCustomerMobile,
            merchant_transaction_id: searchMerchantTransactionId,
            eps_transaction_id: searchEpsTransactionId,
            request_id: searchRequestId,
            order_id: searchOrderId,
            status: searchStatus,
            payment_gateway_id: searchPaymentGatewayId
        };

        setAppliedFilters(filters);
        setCurrentPage(1);
        fetchReports(1, filters);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchReports(page);
    };

    // const handleDownloadAll = async () => {
    //     try {
    //         setDownloading(true);

    //         const queryParams = new URLSearchParams();
    //         if (appliedFilters.ticket_numbers) queryParams.append('ticket_numbers', appliedFilters.ticket_numbers);
    //         if (appliedFilters.merchant) queryParams.append('merchant', appliedFilters.merchant);
    //         if (appliedFilters.start_time) queryParams.append('start_time', appliedFilters.start_time);
    //         if (appliedFilters.end_time) queryParams.append('end_time', appliedFilters.end_time);
    //         if (appliedFilters.customer_mobile) queryParams.append('customer_mobile', appliedFilters.customer_mobile);
    //         if (appliedFilters.merchant_transaction_id) queryParams.append('merchant_transaction_id', appliedFilters.merchant_transaction_id);
    //         if (appliedFilters.eps_transaction_id) queryParams.append('eps_transaction_id', appliedFilters.eps_transaction_id);

    //         const queryString = queryParams.toString();
    //         const url = queryString
    //             ? `${BASE_URL}/report-download?${queryString}`
    //             : `${BASE_URL}/report-download`;

    //         const response = await fetch(url, {
    //             method: 'POST',
    //             headers: getAuthHeaders(),
    //             credentials: 'include',
    //         });

    //         if (handleUnauthorized(response)) return;

    //         if (!response.ok) {
    //             throw new Error('Failed to download report');
    //         }

    //         const contentDisposition = response.headers.get('Content-Disposition');
    //         let filename = 'purchase-log.xlsx';
    //         if (contentDisposition) {
    //             const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
    //             if (filenameMatch) filename = filenameMatch[1];
    //         }

    //         const blob = await response.blob();
    //         const downloadUrl = window.URL.createObjectURL(blob);
    //         const link = document.createElement('a');
    //         link.href = downloadUrl;
    //         link.download = filename;
    //         document.body.appendChild(link);
    //         link.click();
    //         document.body.removeChild(link);
    //         window.URL.revokeObjectURL(downloadUrl);

    //         showAlert('Report downloaded successfully', 'success');
    //     } catch (error) {
    //         console.error('Error downloading report:', error);
    //         showAlert('Failed to download report', 'danger');
    //     } finally {
    //         setDownloading(false);
    //     }
    // };

    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        customClass: {
            popup: 'small-toast',
            icon: 'small-toast-icon'
        },
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });

    const handleSendSms = async (report) => {
        setActionMenuId(null);

        try {
            const response = await fetch(`${BASE_URL}/send-ticket`, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ id: report.id })
            });

            if (handleUnauthorized(response)) return;

            if (!response.ok) {
                throw new Error('Failed to send SMS');
            }

            const result = await response.json();

            if (result.status === 'success') {
                Toast.fire({
                    icon: 'success',
                    title: 'SMS sent successfully'
                });
            } else {
                throw new Error(result.message || 'Failed to send SMS');
            }
        } catch (error) {
            console.error('Error sending SMS:', error);
            Toast.fire({
                icon: 'error',
                title: 'Failed to send SMS'
            });
        }
    };
    const generatePDFReceipt = (report) => {
        if (!window.jspdf) {
            showAlert('PDF library is loading. Please try again.', 'danger');
            return;
        }

        const { jsPDF } = window.jspdf;
        const HEADER_HEIGHT = 75; // Increased to accommodate new layout
        const TICKET_ROW_HEIGHT = 5;
        const BOTTOM_MARGIN = 15;

        const tickets = report.ticket_numbers ? report.ticket_numbers.split(',').map(t => t.trim()) : [];

        let pageHeight = HEADER_HEIGHT + tickets.length * TICKET_ROW_HEIGHT + BOTTOM_MARGIN;
        pageHeight = Math.max(pageHeight, 110); // Increased minimum height

        const pageWidth = 210;

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [pageHeight, pageWidth],
        });

        // Background
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Border
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

        // Logo
        try {
            doc.addImage(headerLogo, 'PNG', 15, 15, 35, 18);
        } catch { }

        // Header text
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(128, 0, 128);
        doc.text('Bangladesh Thalassaemia Samity (BTS)', 53, 22);

        doc.setTextColor(2, 107, 57);
        doc.text('Lottery 2025 (Govt. Approved)', 53, 28);

        // Format date helper
        const formatForPDF = (date) => date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        const generatedTime = formatForPDF(new Date());

        let verifiedTime = 'N/A';
        if (report.verification_time) {
            const verifiedDate = new Date(report.verification_time.replace(' ', 'T'));
            if (!isNaN(verifiedDate)) {
                verifiedTime = formatForPDF(verifiedDate);
            }
        }

        // Timestamps
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated at: ${generatedTime}`, 15, 38);

        // Payment Verified (above "Verified at")
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(34, 139, 34);
        doc.text('Payment Verified', pageWidth - 70, 33);

        // Verified at timestamp
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Verified at: ${verifiedTime}`, pageWidth - 70, 38);

        // Separator line
        doc.setDrawColor(200, 200, 200);
        doc.line(15, 47, pageWidth - 15, 47);

        // LEFT SIDE - Customer Information
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);

        doc.setFont(undefined, 'normal');
        doc.text('Name:', 15, 52);
        doc.setFont(undefined, 'bold');
        doc.text(report.customer_name || 'N/A', 45, 52);

        doc.setFont(undefined, 'normal');
        doc.text('Mobile:', 15, 57);
        doc.setFont(undefined, 'bold');
        doc.text(report.customer_mobile || 'N/A', 45, 57);

        doc.setFont(undefined, 'normal');
        doc.text('District:', 15, 62);
        doc.setFont(undefined, 'bold');
        doc.text(report.customer_district || 'N/A', 45, 62);

        // RIGHT SIDE - Transaction IDs
        const rightColX = pageWidth - 95; // Right column X position
        let transactionYPos = 52;

        // Only show Merchant Transaction ID if it exists and is not N/A
        if (report.merchant_transaction_id && report.merchant_transaction_id !== 'N/A') {
            doc.setFont(undefined, 'normal');
            doc.text('Merchant Transaction ID:', rightColX, transactionYPos);
            doc.setFont(undefined, 'bold');
            doc.text(report.merchant_transaction_id, rightColX + 50, transactionYPos);
            transactionYPos += 5;
        }

        // Only show EPS Transaction ID if it exists and is not N/A
        if (report.eps_transaction_id && report.eps_transaction_id !== 'N/A') {
            doc.setFont(undefined, 'normal');
            doc.text('EPS Transaction ID:', rightColX, transactionYPos);
            doc.setFont(undefined, 'bold');
            doc.text(report.eps_transaction_id, rightColX + 50, transactionYPos);
        }

        // Ticket section header
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('YOUR TICKET INFORMATION', 15, 70);

        doc.setDrawColor(200, 200, 200);
        doc.line(15, 72, pageWidth - 15, 72);

        // Tickets list
        let yPos = 77;
        doc.setFontSize(8);

        tickets.forEach((ticket, index) => {
            doc.setFont(undefined, 'bold');
            doc.text(`Ticket ${index + 1}:`, 15, yPos);

            doc.setFont(undefined, 'normal');
            doc.text(ticket, 35, yPos);

            yPos += TICKET_ROW_HEIGHT;
        });

        return doc;
    };


    const handleDownloadPDF = (report) => {
        setActionMenuId(null);

        try {
            const doc = generatePDFReceipt(report);
            if (doc) {
                doc.save(`Lottery-Ticket-${report.customer_mobile}.pdf`);
                Toast.fire({
                    icon: 'success',
                    title: 'PDF downloaded'
                });
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            Toast.fire({
                icon: 'error',
                title: 'Failed to generate PDF'
            });
        }
    };

    const handleSendEmail = async (report) => {
        setActionMenuId(null);

        const { value: email } = await Swal.fire({
            title: 'Send Receipt via Email',
            input: 'email',
            inputLabel: 'Enter recipient email address',
            inputPlaceholder: 'example@domain.com',
            showCancelButton: true,
            confirmButtonText: 'Send',
            cancelButtonText: 'Cancel',
            inputValidator: (value) => {
                if (!value) {
                    return 'Please enter an email address';
                }
                if (!/^\S+@\S+\.\S+$/.test(value)) {
                    return 'Please enter a valid email address';
                }
                return null;
            }
        });

        if (email) {
            try {
                const doc = generatePDFReceipt(report);
                if (!doc) return;

                const pdfBase64 = doc.output('datauristring');

                const response = await fetch(`${BASE_URL}/send-receipt-email`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    credentials: 'include',
                    body: JSON.stringify({
                        id: report.id,
                        email: email,
                        pdf_data: pdfBase64,
                        merchant_transaction_id: report.merchant_transaction_id,
                        customer_mobile: report.customer_mobile
                    })
                });

                if (handleUnauthorized(response)) return;

                if (!response.ok) {
                    throw new Error('Failed to send email');
                }

                const result = await response.json();

                if (result.status === 'success') {
                    Toast.fire({
                        icon: 'success',
                        title: 'Email sent successfully'
                    });
                } else {
                    throw new Error(result.message || 'Failed to send email');
                }
            } catch (error) {
                console.error('Error sending email:', error);
                Toast.fire({
                    icon: 'error',
                    title: 'Failed to send email'
                });
            }
        }
    };

    const showAlert = (message, variant) => {
        setAlertMessage(message);
        setAlertVariant(variant);
        setTimeout(() => setAlertMessage(''), 3000);
    };

    const renderPagination = () => {
        return (
            <Paginate
                paginator={paginator}
                currentPage={currentPage}
                pagechanged={handlePageChange}
            />
        );
    };

    const handleShowTickets = (ticketNumbers) => {
        setSelectedTickets(ticketNumbers.split(',').map(t => t.trim()));
        setShowModal(true);
    };

    const containerStyle = { padding: '16px', backgroundColor: '#F5F5F5', overflowX: 'hidden', minHeight: '100vh' };

    return (
        <div style={containerStyle}>
            <style>{`
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 7px;
                    flex-wrap: nowrap;
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
                @media (max-width: 483px) {
                    .page-header h1 {
                        font-size: 14px;
                    }
                    .page-header .breadcrumb-nav {
                        font-size: 10px;
                    }
                    .page-header .breadcrumb-nav .home-icon {
                        font-size: 10px !important;
                    }
                    .page-header .breadcrumb-nav .separator {
                        margin: 0 4px !important;
                    }
                }
            `}</style>

            {/* Header with Breadcrumb */}
            <div className='mt-5 page-header'>
                <h1>Purchase Log</h1>
                <div className="breadcrumb-nav">
                    <span
                        style={{
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            transition: 'color 0.2s'
                        }}
                        onClick={() => window.location.href = '/admin/home'}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'blue'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#555'}
                    >
                        <FaHome className="home-icon" style={{ fontSize: '14px' }} />
                        <span>Home</span>
                    </span>
                    <span className="separator" style={{ margin: '0 8px' }}>/</span>
                    <span
                        style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                        onClick={() => window.location.href = '/admin/home'}
                        onMouseEnter={(e) => e.target.style.color = 'blue'}
                        onMouseLeave={(e) => e.target.style.color = '#555'}
                    >
                        Reports
                    </span>
                    <span className="separator" style={{ margin: '0 8px' }}>/</span>
                    <span>Purchase Log</span>
                </div>
            </div>

            {/* Alert */}
            {alertMessage && (
                <div style={{
                    padding: '12px 20px',
                    marginBottom: '11px',
                    borderRadius: '4px',
                    backgroundColor: alertVariant === 'success' ? '#d4edda' : alertVariant === 'danger' ? '#f8d7da' : alertVariant === 'info' ? '#d1ecf1' : '#fff3cd',
                    color: alertVariant === 'success' ? '#155724' : alertVariant === 'danger' ? '#721c24' : alertVariant === 'info' ? '#0c5460' : '#856404',
                    border: `1px solid ${alertVariant === 'success' ? '#c3e6cb' : alertVariant === 'danger' ? '#f5c6cb' : alertVariant === 'info' ? '#bee5eb' : '#ffeeba'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <span>{alertMessage}</span>
                    <button
                        onClick={() => setAlertMessage('')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Filter Section */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '10px'
            }}>
                <style>{`
                    .filter-grid {
                        display: grid;
                        gap: 12px;
                        margin-bottom: 10px;
                    }
                    
                    /* Large screens: 8 columns */
                    @media (min-width: 1200px) {
                        .filter-grid {
                            grid-template-columns: repeat(8, 1fr);
                        }
                        /* All items span 2 columns */
                        .filter-grid > div {
                            grid-column: span 2;
                        }
                        /* Buttons (12th and 13th items) span 1 column */
                        .filter-grid > div:nth-child(12),
                        .filter-grid > div:nth-child(13) {
                            grid-column: span 1;
                        }
                    }
                    
                    /* Medium screens: 3 columns per row */
                    @media (min-width: 768px) and (max-width: 1199px) {
                        .filter-grid {
                            grid-template-columns: repeat(3, 1fr);
                        }
                    }
                    
                    /* Small screens: 2 columns per row */
                    @media (max-width: 767px) {
                        .filter-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                    }
                    
                    .filter-field {
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .filter-field label {
                        margin-bottom: 4px;
                        fontSize: 13px;
                        font-weight: 500;
                        color: #333;
                    }
                `}</style>

                <div className="filter-grid">
                    {/* Merchant Input */}
                    <div className="filter-field">
                        <label>Partner</label>
                        <input
                            type="text"
                            value={searchMerchant}
                            onChange={(e) => setSearchMerchant(e.target.value)}
                            placeholder="Enter partner"
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '13px',
                                width: '100%',
                                backgroundColor: '#fff',
                            }}
                        />
                    </div>

                    {/* Ticket Numbers Input */}
                    <div className="filter-field">
                        <label>Ticket Numbers</label>
                        <input
                            type="text"
                            value={searchTicketNumbers}
                            onChange={(e) => setSearchTicketNumbers(e.target.value)}
                            placeholder="Enter ticket numbers"
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '13px',
                                width: '100%',
                                backgroundColor: '#fff',
                            }}
                        />
                    </div>

                    {/* Customer Mobile Input */}
                    <div className="filter-field">
                        <label>Customer Mobile</label>
                        <input
                            type="text"
                            value={searchCustomerMobile}
                            onChange={(e) => setSearchCustomerMobile(e.target.value)}
                            placeholder="Enter mobile no"
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '13px',
                                width: '100%',
                                backgroundColor: '#fff',
                            }}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="filter-field">
                        <label>Status</label>
                        <select
                            value={searchStatus}
                            onChange={(e) => setSearchStatus(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '13px',
                                width: '100%',
                                backgroundColor: '#fff',
                                cursor: 'pointer',
                            }}
                        >
                            <option value="">All</option>
                            <option value="requested">Requested</option>
                            <option value="success">Success</option>
                            <option value="cancel">Cancel</option>
                            <option value="fail">Fail</option>
                        </select>
                    </div>

                    {/* Payment Gateway Filter */}
                    <div className="filter-field">
                        <label>Payment Gateway</label>
                        <select
                            value={searchPaymentGatewayId}
                            onChange={(e) => setSearchPaymentGatewayId(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '13px',
                                width: '100%',
                                backgroundColor: '#fff',
                                cursor: 'pointer',
                            }}
                        >
                            <option value="">All Gates</option>
                            {paymentGateways.map(gateway => (
                                <option key={gateway.id} value={gateway.id}>{gateway.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Merchant Transaction ID Input */}
                    <div className="filter-field">
                        <label>Merchant Tx ID</label>
                        <input
                            type="text"
                            value={searchMerchantTransactionId}
                            onChange={(e) => setSearchMerchantTransactionId(e.target.value)}
                            placeholder="Enter merchant tx id"
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '13px',
                                width: '100%',
                                backgroundColor: '#fff',
                            }}
                        />
                    </div>

                    {/* EPS Transaction ID Input */}
                    <div className="filter-field">
                        <label>EPS Tx ID</label>
                        <input
                            type="text"
                            value={searchEpsTransactionId}
                            onChange={(e) => setSearchEpsTransactionId(e.target.value)}
                            placeholder="Enter eps tx id"
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '13px',
                                width: '100%',
                                backgroundColor: '#fff',
                            }}
                        />
                    </div>

                    {/* Request ID Input */}
                    <div className="filter-field">
                        <label>Request ID</label>
                        <input
                            type="text"
                            value={searchRequestId}
                            onChange={(e) => setSearchRequestId(e.target.value)}
                            placeholder="Enter request id"
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '13px',
                                width: '100%',
                                backgroundColor: '#fff',
                            }}
                        />
                    </div>

                    {/* Order ID Input */}
                    <div className="filter-field">
                        <label>Order ID</label>
                        <input
                            type="text"
                            value={searchOrderId}
                            onChange={(e) => setSearchOrderId(e.target.value)}
                            placeholder="Enter order id"
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '13px',
                                width: '100%',
                                backgroundColor: '#fff',
                            }}
                        />
                    </div>

                    {/* Date From */}
                    <div className="filter-field">
                        <label>Date From</label>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <input
                                type="text"
                                readOnly
                                value={formatDisplayDate(searchDateFrom)}
                                placeholder="dd-mm-yyyy"
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    width: '100%',
                                    backgroundColor: '#fff',
                                }}
                            />
                            <input
                                type="date"
                                value={searchDateFrom}
                                onChange={handleDateChange(setSearchDateFrom)}
                                onClick={(e) => {
                                    try {
                                        if (e.target.showPicker) e.target.showPicker();
                                    } catch (err) { }
                                }}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0,
                                    zIndex: 10,
                                    cursor: 'pointer',
                                }}
                            />
                        </div>
                    </div>

                    {/* Date To */}
                    <div className="filter-field">
                        <label>Date To</label>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <input
                                type="text"
                                readOnly
                                value={formatDisplayDate(searchDateTo)}
                                placeholder="dd-mm-yyyy"
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    width: '100%',
                                    backgroundColor: '#fff',
                                }}
                            />
                            <input
                                type="date"
                                value={searchDateTo}
                                onChange={handleDateChange(setSearchDateTo)}
                                onClick={(e) => {
                                    try {
                                        if (e.target.showPicker) e.target.showPicker();
                                    } catch (err) { }
                                }}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0,
                                    zIndex: 10,
                                    cursor: 'pointer',
                                }}
                            />
                        </div>
                    </div>

                    {/* Filter Button */}
                    <div className="filter-field">
                        <label style={{ visibility: 'hidden' }}>&nbsp;</label>
                        <button
                            onClick={handleFilter}
                            disabled={loading}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '4px',
                                background: 'linear-gradient(45deg, #007bff, #0056b3)',
                                color: 'white',
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                height: '34px',
                                opacity: loading ? 0.6 : 1,
                                width: '100%',
                                justifyContent: 'center'
                            }}
                        >
                            {loading ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px', fontSize: '12px' }}></i>
                                    Filtering...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-filter" style={{ marginRight: '6px', fontSize: '12px' }}></i>
                                    Filter
                                </>
                            )}
                        </button>
                    </div>

                    {/* Clear Button */}
                    <div className="filter-field">
                        <label style={{ visibility: 'hidden' }}>&nbsp;</label>
                        <button
                            onClick={handleClear}
                            disabled={loading}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '2px',
                                background: 'transparent',
                                color: 'rgb(233, 30, 99)',
                                border: '1px dashed',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                height: '34px',
                                opacity: loading ? 0.6 : 1,
                                width: '100%',
                                justifyContent: 'center'
                            }}
                        >
                            <i className="fa-solid fa-times" style={{ marginRight: '6px', fontSize: '12px' }}></i> Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Card Container */}
            <div className='mt-3' style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '10px'
            }}>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table
                        className="table table-bordered table-hover table-sm align-middle"
                        style={{ fontSize: "12px", lineHeight: "1.8", minWidth: '100%' }}
                    >
                        <thead className="table-light">
                            <tr>
                                <th className="py-2 px-3 fw-semibold text-center" style={{ width: "60px" }}>S/N</th>
                                <th className="py-2 px-3 fw-semibold text-start">Ticket Numbers</th>
                                <th className="py-2 px-3 fw-semibold text-start">Partner</th>
                                <th className="py-2 px-3 fw-semibold text-start">Customer Info</th>
                                <th className="py-2 px-3 fw-semibold text-start">Purchase Details</th>
                                <th className="py-2 px-3 fw-semibold text-center">Status</th>
                                <th className="py-2 px-3 fw-semibold text-start">P.G.</th>
                                <th className="py-2 px-3 fw-semibold text-start">Transaction Details</th>
                                <th className="py-2 px-3 fw-semibold text-start">Timing Details</th>
                                <th className="py-2 px-3 fw-semibold text-center" style={{ width: "80px" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <SkeletonLoader type="table" count={5} columns={11} />
                            ) : reports.length > 0 ? (
                                reports.map((report, i) => (
                                    <tr key={report.id} className="align-middle">
                                        <td className="py-1 px-3 text-center">
                                            {paginator?.current_page > 1
                                                ? (paginator?.current_page - 1) * paginator?.record_per_page + i + 1
                                                : i + 1}
                                        </td>
                                        <td className="py-1 px-3">
                                            {report.ticket_numbers ? (
                                                report.ticket_numbers.includes(',') ? (
                                                    <span
                                                        style={{ cursor: 'pointer', color: '#007bff' }}
                                                        onClick={() => handleShowTickets(report.ticket_numbers)}
                                                    >
                                                        {report.ticket_numbers.split(',').length} tickets <i className="fa-solid fa-eye" style={{ fontSize: '12px' }}></i>
                                                    </span>
                                                ) : (
                                                    report.ticket_numbers
                                                )
                                            ) : 'N/A'}
                                        </td>
                                        <td className="py-1 px-3">{report.merchant || 'N/A'}</td>
                                        <td className="py-1 px-3">
                                            <div style={{ lineHeight: '1.3' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '500' }}>
                                                    <BsTelephonePlus style={{ fontSize: '8px' }}></BsTelephonePlus> {report.customer_mobile || 'N/A'}
                                                </div>
                                                {report.customer_name && (
                                                    <div style={{ fontSize: '10px', color: '#666' }}>
                                                        <FaPerson style={{ fontSize: '8px' }}></FaPerson> {report.customer_name}
                                                    </div>
                                                )}
                                                {report.customer_district && (
                                                    <div style={{ fontSize: '10px', color: '#888', textTransform: 'capitalize' }}>
                                                        <FaLocationDot style={{ fontSize: '8px' }}></FaLocationDot> {report.customer_district}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-1 px-3">
                                            <div style={{ lineHeight: '1.3' }}>
                                                <div style={{ fontSize: '11px' }}>Qty: {report.ticket_qty || 'N/A'}</div>
                                                <div style={{ fontSize: '11px' }}>Unit: ৳{parseFloat(report.unit_price || 0).toFixed(2)}</div>
                                                <div style={{ fontSize: '11px' }}>Total: ৳{parseFloat(report.total_amount || 0).toFixed(2)}</div>
                                            </div>
                                        </td>
                                        <td className="py-1 px-3 text-center">
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                backgroundColor: statusOptions[report.status]?.bg || '#fff3cd',
                                                color: statusOptions[report.status]?.color || '#333',
                                                fontWeight: '500'
                                            }}>
                                                {statusOptions[report.status]?.label || report.status}
                                            </span>
                                        </td>
                                        <td className="py-1 px-3 text-start">
                                            <div style={{ fontSize: '11px', fontWeight: '500' }}>
                                                {report.payment_gateway?.name || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="py-1 px-3">
                                            <div style={{ lineHeight: '1.3' }}>
                                                {/* Payment Gateway ID = 2 → Order ID */}
                                                {report.payment_gateway_id === 2 ? (
                                                    <div style={{ fontSize: '11px' }}>
                                                        Order-ID: {report.order_id || 'N/A'}
                                                    </div>

                                                ) : report.payment_gateway_id === 3 ? (
                                                    /* Payment Gateway ID = 3 only  T-ID */
                                                    <div style={{ fontSize: '11px' }}>
                                                        T-ID: {report.merchant_transaction_id || 'N/A'}
                                                    </div>

                                                )
                                                    : report.payment_gateway_id === 4 ? (
                                                        /* Payment Gateway ID = 4 → Only Request-id */
                                                        <div style={{ fontSize: '11px' }}>
                                                            Req-ID: {report.request_id || 'N/A'}
                                                        </div>

                                                    )
                                                        : (
                                                            /* All other gateways */
                                                            <>
                                                                <div style={{ fontSize: '11px' }}>
                                                                    M-TID: {report.merchant_transaction_id || 'N/A'}
                                                                </div>
                                                                <div style={{ fontSize: '11px' }}>
                                                                    EPS-TID: {report.eps_transaction_id || 'N/A'}
                                                                </div>
                                                            </>
                                                        )}
                                                <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                                                    Type: {report.transaction_type || 'N/A'} | Entity: {report.financial_entity || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-1 px-3">
                                            <div style={{ lineHeight: '1.3' }}>
                                                <div style={{ fontSize: '11px', background: '#E8F4FD' }}>
                                                    Req-Time: {formatDisplayDateTime(report.request_time) || 'N/A'}
                                                </div>
                                                <div style={{ fontSize: '11px', background: '#FFF6E5' }}>
                                                    Txn-Time: {formatDisplayDateTime(report.transaction_time) || 'N/A'}
                                                </div>
                                                <div style={{ fontSize: '11px', background: '#E9F7E9' }}>
                                                    Vrf-Time: {formatDisplayDateTime(report.verification_time) || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        {/* Actions column */}
                                        <td className="py-1 px-3 text-center position-relative">
                                            <button
                                                className="btn btn-link p-0"
                                                style={{ fontSize: "12px" }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActionMenuId(actionMenuId === report.id ? null : report.id);
                                                }}
                                            >
                                                <i className="fa-solid fa-ellipsis-v"></i>
                                            </button>

                                            {actionMenuId === report.id && (
                                                <div
                                                    className="position-absolute bg-white border rounded shadow-sm py-1"
                                                    style={{
                                                        top: "24px",
                                                        right: "10px",
                                                        zIndex: 10,
                                                        minWidth: "140px",
                                                        fontSize: "12px",
                                                        lineHeight: "1.1",
                                                    }}
                                                >
                                                    {report.ticket_numbers && report.merchant_info?.is_pdf_ticket_downloadable === 1 && (
                                                        <button
                                                            onClick={() => handleDownloadPDF(report)}
                                                            className="dropdown-item py-0 px-2 d-flex align-items-center text-primary"
                                                            style={{
                                                                fontSize: "12px",
                                                                height: "24px",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            <i className="fa-solid fa-file-pdf me-2" style={{ fontSize: "12px" }}></i>
                                                            Download PDF
                                                        </button>
                                                    )}


                                                    {/* <button
                                                        onClick={() => handleSendEmail(report)}
                                                        className="dropdown-item py-0 px-2 d-flex align-items-center text-info"
                                                        style={{
                                                            fontSize: "12px",
                                                            height: "24px",
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-envelope me-2" style={{ fontSize: "12px" }}></i>
                                                        Send via Email
                                                    </button> */}
                                                    {report.ticket_numbers && (
                                                        <button
                                                            onClick={() => confirmAndSendSms(report)}
                                                            className="dropdown-item py-0 px-2 d-flex align-items-center text-success"
                                                            style={{
                                                                fontSize: "12px",
                                                                height: "24px",
                                                                opacity: !report.ticket_numbers ? 0.4 : 1,
                                                                pointerEvents: !report.ticket_numbers ? "none" : "auto",
                                                                cursor: !report.ticket_numbers ? "not-allowed" : "pointer",
                                                            }}
                                                            disabled={!report.ticket_numbers}
                                                        >
                                                            <i className="fa-solid fa-message me-2" style={{ fontSize: "12px" }}></i>
                                                            Send SMS
                                                        </button>
                                                    )}

                                                    {/* Assign Ticket Button - Only shown when no ticket numbers and user has permission */}
                                                    {/* {hasPermission("assign ticket to customer") && (!report.ticket_numbers || report.ticket_numbers === 'N/A') && report.status === "requested" &&  report.status === "success" && ( */}
                                                    {hasPermission("assign ticket to customer") && !report.ticket_numbers && (
                                                        <button
                                                            onClick={() => handleAssignTicketClick(report)}
                                                            className="dropdown-item py-0 px-2 d-flex align-items-center"
                                                            style={{
                                                                fontSize: "12px",
                                                                height: "24px",
                                                                color: "#FF6B35", // Deep orange for activeness
                                                                fontWeight: "500",
                                                            }}
                                                        >
                                                            <i className="fa-solid fa-ticket me-2" style={{ fontSize: "12px", color: "#FF6B35" }}></i>
                                                            Assign Ticket
                                                        </button>
                                                    )}

                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className="text-center text-muted py-3">
                                        {Object.keys(appliedFilters).some(key => appliedFilters[key])
                                            ? "No logs found matching your filters"
                                            : "No logs available"
                                        }
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', flexWrap: 'wrap', gap: '10px' }}>
                        {/* Pagination Info */}
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            Showing{" "}
                            {paginator.current_page_items_count > 0
                                ? formatBDT((paginator.current_page - 1) * paginator.record_per_page + 1)
                                : 0}{" "}
                            to{" "}
                            {formatBDT(Math.min(
                                paginator.current_page * paginator.record_per_page,
                                paginator.total_count
                            ))}{" "}
                            of {formatBDT(paginator.total_count)} results
                        </div>

                        {/* Pagination Controls */}
                        {paginator?.total_pages > 1 && (
                            <div>
                                {renderPagination()}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Ticket Numbers Modal */}
            {
                showModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999
                    }}>
                        <div style={{
                            background: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            maxWidth: '400px',
                            maxHeight: '80%',
                            overflowY: 'auto'
                        }}>
                            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Ticket Numbers</h3>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '5px',
                                fontSize: '12px'
                            }}>
                                {selectedTickets.map((ticket, index) => (
                                    <div key={index}>{ticket}</div>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    marginTop: '15px',
                                    padding: '8px 16px',
                                    background: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Assign Ticket Modal */}
            {
                showAssignModal && selectedReportForAssign && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000
                    }}>
                        <div style={{
                            background: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            maxWidth: '400px',
                            width: '100%',
                            maxHeight: '80%',
                            overflowY: 'auto'
                        }}>
                            <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Assign Ticket to Customer</h3>

                            <div style={{ marginBottom: '15px' }}>
                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                                    Customer: {selectedReportForAssign.customer_mobile || 'N/A'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                                    Merchant TID: {selectedReportForAssign.merchant_transaction_id || 'N/A'}
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: '500' }}>
                                    EPS Transaction ID
                                </label>
                                <input
                                    type="text"
                                    value={assignForm.eps_transaction_id}
                                    onChange={(e) => setAssignForm({ ...assignForm, eps_transaction_id: e.target.value })}
                                    placeholder="Enter EPS transaction ID"
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        fontSize: '12px'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: '500' }}>
                                    Transaction Type
                                </label>
                                <input
                                    type="text"
                                    value={assignForm.transaction_type}
                                    onChange={(e) => setAssignForm({ ...assignForm, transaction_type: e.target.value })}
                                    placeholder="Enter transaction type"
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        backgroundColor: '#fff',
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: '500' }}>
                                    Financial Entity
                                </label>
                                <input
                                    type="text"
                                    value={assignForm.financial_entity}
                                    onChange={(e) => setAssignForm({ ...assignForm, financial_entity: e.target.value })}
                                    placeholder="Enter financial entity"
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        backgroundColor: '#fff',
                                    }}
                                />
                            </div>


                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedReportForAssign(null);
                                    }}
                                    disabled={assignLoading}
                                    style={{
                                        padding: '8px 16px',
                                        background: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: assignLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '12px',
                                        opacity: assignLoading ? 0.6 : 1
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssignTicketSubmit}
                                    // disabled={assignLoading || !assignForm.eps_transaction_id.trim()}
                                    disabled={assignLoading}
                                    style={{
                                        padding: '8px 16px',
                                        background: assignLoading ? '#cccccc' : '#28a745',
                                        // background: assignLoading || !assignForm.eps_transaction_id.trim() ? '#cccccc' : '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: assignLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '12px',
                                        opacity: assignLoading ? 0.6 : 1
                                    }}
                                >
                                    {assignLoading ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
                                            Assigning...
                                        </>
                                    ) : (
                                        'Assign Ticket'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Global Skeleton Animation */}
            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                
                .inline-block {
                    display: inline-block;
                }
                
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .rounded-full {
                    border-radius: 9999px;
                }
                
                .h-8 {
                    height: 2rem;
                }
                
                .w-8 {
                    width: 2rem;
                }
                
                .border-b-2 {
                    border-bottom-width: 2px;
                }
                
                .border-teal-500 {
                    border-color: #14b8a6;
                }
                
                .mb-4 {
                    margin-bottom: 1rem;
                }
                
                .text-gray-600 {
                    color: #4b5563;
                }
                
                /* Fix for browser autofill styles */
                .autofill-fix input:-webkit-autofill,
                .autofill-fix input:-webkit-autofill:hover,
                .autofill-fix input:-webkit-autofill:focus,
                .autofill-fix input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0px 1000px white inset !important;
                    -webkit-text-fill-color: #000 !important;
                    transition: background-color 5000s ease-in-out 0s !important;
                }
                
                .autofill-fix input {
                    color: #000 !important;
                }
                
                /* Custom styles for action dropdown */
                .dropdown-item {
                    transition: all 0.2s;
                }
                
                .dropdown-item:hover {
                    background-color: #f8f9fa;
                }
            `}</style>
        </div >
    );
};

export default PurchaseLogPage;