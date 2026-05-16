// SalesSummaryReportPage.jsx
import React, { useState, useEffect } from 'react';
import Paginate from './Paginate';
import { FaHome } from 'react-icons/fa';
import Select from 'react-select';
import SkeletonLoader from './SkeletonLoader';
// import SkeletonLoader from './SkeletonLoader';

const BASE_URL = `${import.meta.env.VITE_APP_API_BASE_URL}/api/v1/summary-report`;

const SalesSummaryReportPage = ({ sidebarVisible = false }) => {
    // Only current page reports (server-side pagination)
    const [reports, setReports] = useState([]);
    const [searchMerchant, setSearchMerchant] = useState([]);
    const [searchTicketType, setSearchTicketType] = useState('');
    const [searchDateFrom, setSearchDateFrom] = useState('');
    const [searchDateTo, setSearchDateTo] = useState('');
    const [showTicketSummaryModal, setShowTicketSummaryModal] = useState(false);
    const [selectedTicketSummary, setSelectedTicketSummary] = useState(null);
    const [selectedMerchantName, setSelectedMerchantName] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertVariant, setAlertVariant] = useState('success');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [actionMenuId, setActionMenuId] = useState(null);
    const [filterOptions, setFilterOptions] = useState({
        merchant_list: []
    });
    const [appliedFilters, setAppliedFilters] = useState({
        merchant_id: [],
        ticket_type: '',
        start_time: '',
        end_time: ''
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

    const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

    const ticketTypeOptions = [
        { value: '', label: 'All Types' },
        { value: 'virtual', label: 'Virtual' },
        { value: 'physical', label: 'Physical' }
    ];

    const handleDateChange = (setter) => (e) => {
        setter(e.target.value);
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
    };

    const handleViewTicketSummary = (report) => {
        setSelectedTicketSummary(report.ticket_summary || []);
        setSelectedMerchantName(report.merchant_name || 'Merchant');
        setShowTicketSummaryModal(true);
        setActionMenuId(null); // Close any open action menu
    };

    // Get auth headers
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

    // Handle 401 errors
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

    const formatBDT = (number) => {
        const num = Math.round(Number(number)); // round to nearest integer
        if (Number.isNaN(num)) return '0';
        return num.toLocaleString('en-IN'); // format with commas
    };

    // Load filter options + initial reports
    useEffect(() => {
        fetchFilterOptions();
        fetchReports(1);
    }, []);

    // Handle click outside for action menu
    useEffect(() => {
        const handleClickOutside = () => setActionMenuId(null);
        if (actionMenuId !== null) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [actionMenuId]);

    // Fetch filter options
    const fetchFilterOptions = async () => {
        try {
            setFilterOptionsLoading(true);
            const response = await fetch(`${BASE_URL}/filter-data`, {
                method: 'GET',
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (handleUnauthorized(response)) return;

            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            if (result.status === 'success') {
                const data = result?.data ?? {};
                const merchantList = data.merchant_list?.map((m) => ({
                    value: m.value,
                    label: m.label
                })) ?? [];

                setFilterOptions({
                    merchant_list: merchantList
                });
            }
        } catch (error) {
            console.error('Error fetching filter options:', error);
            showAlert('Failed to load filter options', 'danger');
        } finally {
            setFilterOptionsLoading(false);
        }
    };

    // Fetch reports with server-side pagination
    const fetchReports = async (page = 1, filters = null) => {
        try {
            setLoading(true);

            const queryParams = new URLSearchParams();
            queryParams.append('page', page);

            // Use passed filters or fall back to appliedFilters
            const activeFilters = filters || appliedFilters;

            if (activeFilters.merchant_id) {
                if (Array.isArray(activeFilters.merchant_id)) {
                    activeFilters.merchant_id.forEach(id => {
                        if (id) queryParams.append('merchant_ids[]', id);
                    });
                } else {
                    queryParams.append('merchant_id', activeFilters.merchant_id);
                }
            }
            if (activeFilters.ticket_type) queryParams.append('ticket_type', activeFilters.ticket_type);
            if (activeFilters.start_time) queryParams.append('start_time', activeFilters.start_time);
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

    // Handle clear filters
    const handleClear = () => {
        setSearchMerchant([]);
        setSearchTicketType('');
        setSearchDateFrom('');
        setSearchDateTo('');

        const emptyFilters = {
            merchant_id: [],
            ticket_type: '',
            start_time: '',
            end_time: ''
        };

        setAppliedFilters(emptyFilters);
        setCurrentPage(1);
        fetchReports(1, emptyFilters);
    };

    // Handle filter
    const handleFilter = () => {
        const filters = {
            merchant_id: searchMerchant,
            ticket_type: searchTicketType,
            start_time: searchDateFrom ? `${searchDateFrom} 00:00:00` : '',
            end_time: searchDateTo ? `${searchDateTo} 23:59:59` : ''
        };

        setAppliedFilters(filters);
        setCurrentPage(1);
        fetchReports(1, filters);
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchReports(page, appliedFilters);
    };

    // Handle download all (Frontend Specific)
    const handleDownloadAll = async () => {
        try {
            setDownloading(true);

            // Dynamically import xlsx
            const XLSX = await import('xlsx');

            const queryParams = new URLSearchParams();
            // Add existing filters
            if (appliedFilters.merchant_id) {
                if (Array.isArray(appliedFilters.merchant_id)) {
                    appliedFilters.merchant_id.forEach(id => {
                        if (id) queryParams.append('merchant_ids[]', id);
                    });
                } else {
                    queryParams.append('merchant_id', appliedFilters.merchant_id);
                }
            }
            if (appliedFilters.ticket_type) queryParams.append('ticket_type', appliedFilters.ticket_type);
            if (appliedFilters.start_time) queryParams.append('start_time', appliedFilters.start_time);
            if (appliedFilters.end_time) queryParams.append('end_time', appliedFilters.end_time);

            // Fetch all data (assuming API supports per_page or returns all if requested)
            // Using a large per_page to try and get all records. Adjust if API uses different param.
            queryParams.append('per_page', '100000');

            const queryString = queryParams.toString();
            const url = `${BASE_URL}/list-paginate?${queryString}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (handleUnauthorized(response)) return;

            if (!response.ok) {
                throw new Error('Failed to fetch report data for download');
            }

            const result = await response.json();

            if (result.status !== 'success' || !result?.data?.data) {
                throw new Error(result.message || 'Invalid data received');
            }

            const dataToExport = result.data.data;

            if (dataToExport.length === 0) {
                showAlert('No data available to download', 'info');
                return;
            }

            // Prepare data for Excel
            const excelData = dataToExport.map((item, index) => ({
                'S/N': index + 1,
                'Partner Name': item.merchant_name || 'N/A',
                'Ticket Allotment': Number(item.ticket_allotment) || 0,
                'Ticket Available': Number(item.ticket_available) || 0,
                'Total Sales': Number(item.total_sales) || 0,
                'Total Sales Amount': Number(item.total_sales_amount) || 0,
            }));

            // Calculate Totals
            const totalRow = {
                'S/N': 'Total',
                'Partner Name': '',
                'Ticket Allotment': excelData.reduce((sum, item) => sum + item['Ticket Allotment'], 0),
                'Ticket Available': excelData.reduce((sum, item) => sum + item['Ticket Available'], 0),
                'Total Sales': excelData.reduce((sum, item) => sum + item['Total Sales'], 0),
                'Total Sales Amount': excelData.reduce((sum, item) => sum + item['Total Sales Amount'], 0),
            };

            excelData.push(totalRow);

            // Create Worksheet
            const ws = XLSX.utils.json_to_sheet(excelData);

            // Set column widths (optional)
            const wscols = [
                { wch: 10 }, // S/N
                { wch: 30 }, // Partner Name
                { wch: 15 }, // Ticket Allotment
                { wch: 15 }, // Ticket Available
                { wch: 15 }, // Total Sales
                { wch: 20 }, // Total Sales Amount
            ];
            ws['!cols'] = wscols;

            // Create Workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Sales Summary");

            // Generate filename
            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `Sales_Summary_Report_${dateStr}.xlsx`;

            // Save File
            XLSX.writeFile(wb, fileName);

            showAlert('Summary report downloaded successfully', 'success');
        } catch (error) {
            console.error('Error downloading summary report:', error);
            showAlert('Failed to download summary report', 'danger');
        } finally {
            setDownloading(false);
        }
    };

    // const handleDownloadSingle = async (report) => {
    //     setActionMenuId(null);

    //     try {
    //         const queryParams = new URLSearchParams();
    //         if (report.merchant_name) {
    //             // Find merchant ID from filter options
    //             const merchant = filterOptions.merchant_list.find(m => m.label === report.merchant_name);
    //             if (merchant) {
    //                 queryParams.append('merchant_id', merchant.value);
    //             }
    //         }

    //         const url = `${BASE_URL}/report-download?${queryParams.toString()}`;

    //         const response = await fetch(url, {
    //             method: 'POST',
    //             headers: getAuthHeaders(),
    //             credentials: 'include',
    //         });

    //         if (handleUnauthorized(response)) return;

    //         if (!response.ok) {
    //             throw new Error('Failed to download merchant summary report');
    //         }

    //         // Get filename from Content-Disposition header or use default
    //         const contentDisposition = response.headers.get('Content-Disposition');
    //         let filename = `summary-${report.merchant_name || 'report'}.xlsx`;
    //         if (contentDisposition) {
    //             const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
    //             if (filenameMatch) {
    //                 filename = filenameMatch[1];
    //             }
    //         }

    //         // Download the file
    //         const blob = await response.blob();
    //         const downloadUrl = window.URL.createObjectURL(blob);
    //         const link = document.createElement('a');
    //         link.href = downloadUrl;
    //         link.download = filename;
    //         document.body.appendChild(link);
    //         link.click();
    //         document.body.removeChild(link);
    //         window.URL.revokeObjectURL(downloadUrl);

    //         showAlert(`Summary for ${report.merchant_name} downloaded successfully`, 'success');
    //     } catch (error) {
    //         console.error('Error downloading merchant summary report:', error);
    //         showAlert('Failed to download merchant summary report', 'danger');
    //     }
    // };

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
                <h1>Sales Summary Report</h1>
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
                    <span>Sales Summary Report</span>
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
                {filterOptionsLoading ? (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'start', alignItems: 'flex-end', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <SkeletonLoader type="filter" count={4} />
                    </div>
                ) : (
                    <>
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
                                /* All items span 2 columns to make 4 items per row */
                                .filter-grid > div {
                                    grid-column: span 2;
                                }
                                /* Buttons (5th and 6th items) span 1 column */
                                .filter-grid > div:nth-child(5),
                                .filter-grid > div:nth-child(6) {
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
                            {/* Merchant Dropdown */}
                            <div className="filter-field">
                                <label>Partner</label>
                                <Select
                                    value={filterOptions.merchant_list.filter(m =>
                                        Array.isArray(searchMerchant)
                                            ? searchMerchant.includes(m.value.toString())
                                            : searchMerchant.toString() === m.value.toString()
                                    )}
                                    onChange={(selectedOptions) => {
                                        const values = selectedOptions ? selectedOptions.map(opt => opt.value.toString()) : [];
                                        setSearchMerchant(values);
                                    }}
                                    options={filterOptions.merchant_list}
                                    isMulti={true}
                                    isClearable={true}
                                    styles={{
                                        indicatorSeparator: () => ({ display: 'none' }),
                                        control: (base, state) => ({
                                            ...base,
                                            padding: '2px 0px',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            fontSize: '13px',
                                            width: '100%',
                                            backgroundColor: '#fff',
                                            cursor: 'pointer',
                                            minHeight: '34px',
                                            boxShadow: state.isFocused ? '0 0 0 1px #007bff' : 'none',
                                            borderColor: state.isFocused ? '#007bff' : '#ccc',
                                            '&:hover': {
                                                borderColor: state.isFocused ? '#007bff' : '#999'
                                            }
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            fontSize: '13px',
                                            zIndex: 9999
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isSelected ? '#007bff' : state.isFocused ? '#f8f9fa' : 'white',
                                            color: state.isSelected ? 'white' : '#333',
                                            cursor: 'pointer',
                                            '&:active': {
                                                backgroundColor: '#007bff',
                                                color: 'white'
                                            }
                                        }),
                                        singleValue: (base) => ({
                                            ...base,
                                            color: '#333'
                                        }),
                                        placeholder: (base) => ({
                                            ...base,
                                            color: '#999'
                                        })
                                    }}
                                    isSearchable={true}
                                    placeholder="All Merchants"
                                />
                            </div>

                            {/* Ticket Type Dropdown */}
                            <div className="filter-field">
                                <label>Ticket Type</label>
                                <Select
                                    value={searchTicketType ? ticketTypeOptions.find(t => t.value === searchTicketType) : null}
                                    onChange={(selectedOption) => setSearchTicketType(selectedOption ? selectedOption.value : '')}
                                    options={ticketTypeOptions}
                                    isClearable={true}
                                    styles={{
                                        indicatorSeparator: () => ({ display: 'none' }),
                                        control: (base, state) => ({
                                            ...base,
                                            padding: '2px 0px',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            fontSize: '13px',
                                            width: '100%',
                                            backgroundColor: '#fff',
                                            cursor: 'pointer',
                                            minHeight: '34px',
                                            boxShadow: state.isFocused ? '0 0 0 1px #007bff' : 'none',
                                            borderColor: state.isFocused ? '#007bff' : '#ccc',
                                            '&:hover': {
                                                borderColor: state.isFocused ? '#007bff' : '#999'
                                            }
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            fontSize: '13px',
                                            zIndex: 9999
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isSelected ? '#007bff' : state.isFocused ? '#f8f9fa' : 'white',
                                            color: state.isSelected ? 'white' : '#333',
                                            cursor: 'pointer'
                                        }),
                                        singleValue: (base) => ({
                                            ...base,
                                            color: '#333'
                                        }),
                                        placeholder: (base) => ({
                                            ...base,
                                            color: '#999'
                                        })
                                    }}
                                    placeholder="All Types"
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
                                            padding: '6px 10px',
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
                                            padding: '6px 10px',
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
                    </>
                )}
            </div>

            {/* Card Container */}
            <div className='mt-3' style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '10px'
            }}>
                {/* Download Button Section */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '10px' }}>
                    <button
                        onClick={handleDownloadAll}
                        disabled={downloading}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '4px',
                            background: 'linear-gradient(45deg, #28a745, #218838)',
                            color: 'white',
                            border: 'none',
                            cursor: downloading ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            opacity: downloading ? 0.6 : 1
                        }}
                    >
                        {downloading ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px', fontSize: '12px' }}></i>
                                Downloading...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-file-excel" style={{ marginRight: '6px', fontSize: '12px' }}></i>
                                Download All
                            </>
                        )}
                    </button>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table
                        className="table table-bordered table-hover table-sm align-middle"
                        style={{ fontSize: "12px", lineHeight: "1.8", minWidth: '100%' }}
                    >
                        <thead className="table-light">
                            <tr>
                                <th className="py-2 px-3 fw-semibold text-center" style={{ width: "60px" }}>S/N</th>
                                <th className="py-2 px-3 fw-semibold text-start">Partner Name</th>
                                <th className="py-2 px-3 fw-semibold text-center">Ticket Allotment</th>
                                <th className="py-2 px-3 fw-semibold text-center">Ticket Available</th>
                                <th className="py-2 px-3 fw-semibold text-center">Total Sales</th>
                                <th className="py-2 px-3 fw-semibold text-center">Total Sales Amount</th>
                                {/* <th className="py-2 px-3 fw-semibold text-center" style={{ width: "80px" }}>Actions</th> */}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <SkeletonLoader type="table" count={5} columns={7} />
                            ) : reports.length > 0 ? (
                                reports.map((report, i) => (
                                    <tr key={i} className="align-middle">
                                        <td className="py-1 px-3 text-center">
                                            {paginator?.current_page > 1
                                                ? (paginator?.current_page - 1) * paginator?.record_per_page + i + 1
                                                : i + 1}
                                        </td>
                                        <td className="py-1 px-3">{report.merchant_name || 'N/A'}</td>
                                        <td className="py-1 px-3 text-center">
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    backgroundColor: '#e3f2fd',
                                                    color: '#1976d2',
                                                    fontWeight: '600'
                                                }}>
                                                    {formatBDT(report.ticket_allotment)}
                                                </span>

                                                {report.ticket_summary && report.ticket_summary.length > 0 && (
                                                    <button
                                                        onClick={() => handleViewTicketSummary(report)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            transition: 'all 0.2s',
                                                            color: '#1976d2'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.target.style.backgroundColor = '#e3f2fd';
                                                            e.target.style.transform = 'scale(1.1)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.backgroundColor = 'transparent';
                                                            e.target.style.transform = 'scale(1)';
                                                        }}
                                                        title="View Ticket Details"
                                                    >
                                                        <i className="fa-solid fa-eye" style={{ fontSize: '12px' }}></i>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-1 px-3 text-center">
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                backgroundColor: '#f3e5f5',
                                                color: '#7b1fa2',
                                                fontWeight: '600'
                                            }}>
                                                {formatBDT(report.ticket_available)}
                                            </span>
                                        </td>
                                        <td className="py-1 px-3 text-center">
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                backgroundColor: '#fff3e0',
                                                color: '#e65100',
                                                fontWeight: '600'
                                            }}>
                                                {formatBDT(report.total_sales)}
                                            </span>
                                        </td>
                                        <td className="py-1 px-3 text-center fw-bold" style={{ color: '#28a745' }}>
                                            ৳{formatBDT(report.total_sales_amount)}
                                        </td>

                                        {/* Actions column */}
                                        {/* <td className="py-1 px-3 text-center position-relative">
                                            <button
                                                className="btn btn-link p-0"
                                                style={{ fontSize: "12px" }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActionMenuId(actionMenuId === i ? null : i);
                                                }}
                                            >
                                                <i className="fa-solid fa-ellipsis-v"></i>
                                            </button>

                                            {actionMenuId === i && (
                                                <div
                                                    className="position-absolute bg-white border rounded shadow-sm py-1"
                                                    style={{
                                                        top: "24px",
                                                        right: "10px",
                                                        zIndex: 10,
                                                        minWidth: "120px",
                                                        fontSize: "12px",
                                                        lineHeight: "1.1",
                                                    }}
                                                >
                                                    <button
                                                        onClick={() => handleDownloadSingle(report)}
                                                        className="dropdown-item py-0 px-2 d-flex align-items-center text-success"
                                                        style={{ fontSize: "12px", height: "24px" }}
                                                    >
                                                        <i className="fa-solid fa-download me-2" style={{ fontSize: "12px" }}></i>
                                                        Download
                                                    </button>
                                                </div>
                                            )}
                                        </td> */}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center text-muted py-3">
                                        {Object.keys(appliedFilters).some(key => appliedFilters[key])
                                            ? "No summary reports found matching your filters"
                                            : "No summary reports available"
                                        }
                                    </td>
                                </tr>
                            )}

                            {/* Total Row */}
                            {!loading && reports.length > 0 && (
                                <tr style={{
                                    backgroundColor: '#f8f9fa',
                                    fontWeight: 'bold',
                                    borderTop: '2px solid #dee2e6'
                                }}>
                                    <td className="py-2 px-3 text-center">Total</td>
                                    <td className="py-2 px-3">All Partners (Current Page)</td>
                                    <td className="py-2 px-3 text-center">
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            backgroundColor: '#e3f2fd',
                                            color: '#1976d2',
                                            fontWeight: '700'
                                        }}>
                                            {formatBDT(reports.reduce((sum, r) => sum + (Number(r.ticket_allotment) || 0), 0))}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            backgroundColor: '#f3e5f5',
                                            color: '#7b1fa2',
                                            fontWeight: '700'
                                        }}>
                                            {formatBDT(reports.reduce((sum, r) => sum + (Number(r.ticket_available) || 0), 0))}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            backgroundColor: '#fff3e0',
                                            color: '#e65100',
                                            fontWeight: '700'
                                        }}>
                                            {formatBDT(reports.reduce((sum, r) => sum + (Number(r.total_sales) || 0), 0))}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 text-center" style={{ color: '#28a745', fontWeight: '800' }}>
                                        ৳{formatBDT(reports.reduce((sum, r) => sum + (Number(r.total_sales_amount) || 0), 0))}
                                    </td>
                                    <td className="py-2 px-3"></td>
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
                
                /* Modal scrollbar styling */
                ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                
                ::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                }
                
                ::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 4px;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: #a8a8a8;
                }
            `}</style>

            {/* Ticket Summary Modal */}
            {showTicketSummaryModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px'
                }} onClick={() => setShowTicketSummaryModal(false)}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '20px',
                        maxWidth: '1000px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }} onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '15px',
                            paddingBottom: '10px',
                            borderBottom: '1px solid #e0e0e0'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                                <i className="fa-solid fa-ticket" style={{ marginRight: '8px', color: '#1976d2' }}></i>
                                Ticket Details - {selectedMerchantName}
                            </h3>
                            <button
                                onClick={() => setShowTicketSummaryModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    color: '#666',
                                    padding: '0 4px',
                                    borderRadius: '4px'
                                }}
                                onMouseEnter={(e) => e.target.style.color = '#ff0000'}
                                onMouseLeave={(e) => e.target.style.color = '#666'}
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {selectedTicketSummary && selectedTicketSummary.length > 0 ? (
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '12px'
                                }}>
                                    <thead>
                                        <tr style={{
                                            backgroundColor: '#f8f9fa',
                                            borderBottom: '2px solid #dee2e6'
                                        }}>
                                            <th style={{
                                                padding: '10px',
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                color: '#495057',
                                                border: '1px solid #dee2e6'
                                            }}>Series</th>
                                            <th style={{
                                                padding: '10px',
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                color: '#495057',
                                                border: '1px solid #dee2e6'
                                            }}>Start Ticket</th>
                                            <th style={{
                                                padding: '10px',
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                color: '#495057',
                                                border: '1px solid #dee2e6'
                                            }}>End Ticket</th>
                                            <th style={{
                                                padding: '10px',
                                                textAlign: 'right',
                                                fontWeight: '600',
                                                color: '#495057',
                                                border: '1px solid #dee2e6'
                                            }}>Total Tickets</th>
                                            <th style={{
                                                padding: '10px',
                                                textAlign: 'right',
                                                fontWeight: '600',
                                                color: '#495057',
                                                border: '1px solid #dee2e6'
                                            }}>Open</th>
                                            <th style={{
                                                padding: '10px',
                                                textAlign: 'right',
                                                fontWeight: '600',
                                                color: '#495057',
                                                border: '1px solid #dee2e6'
                                            }}>On Hold</th>
                                            <th style={{
                                                padding: '10px',
                                                textAlign: 'right',
                                                fontWeight: '600',
                                                color: '#495057',
                                                border: '1px solid #dee2e6'
                                            }}>Closed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedTicketSummary.map((item, index) => (
                                            <tr key={index} style={{
                                                borderBottom: '1px solid #dee2e6',
                                                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                                            }}>
                                                <td style={{
                                                    padding: '10px',
                                                    border: '1px solid #dee2e6',
                                                    fontWeight: '500'
                                                }}>{item.series || 'N/A'}</td>
                                                <td style={{
                                                    padding: '10px',
                                                    border: '1px solid #dee2e6',
                                                    fontFamily: 'monospace'
                                                }}>{item.start_ticket || 'N/A'}</td>
                                                <td style={{
                                                    padding: '10px',
                                                    border: '1px solid #dee2e6',
                                                    fontFamily: 'monospace'
                                                }}>{item.end_ticket || 'N/A'}</td>
                                                <td style={{
                                                    padding: '10px',
                                                    border: '1px solid #dee2e6',
                                                    textAlign: 'right',
                                                    fontWeight: '600',
                                                    color: '#1976d2'
                                                }}>{formatBDT(item.total_tickets)}</td>
                                                <td style={{
                                                    padding: '10px',
                                                    border: '1px solid #dee2e6',
                                                    textAlign: 'right',
                                                    fontWeight: '600',
                                                    color: '#28a745'
                                                }}>
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '3px',
                                                        backgroundColor: '#d4edda',
                                                        color: '#155724'
                                                    }}>
                                                        {formatBDT(item.open_count)}
                                                    </span>
                                                </td>
                                                <td style={{
                                                    padding: '10px',
                                                    border: '1px solid #dee2e6',
                                                    textAlign: 'right',
                                                    fontWeight: '600',
                                                    color: '#ffc107'
                                                }}>
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '3px',
                                                        backgroundColor: '#fff3cd',
                                                        color: '#856404'
                                                    }}>
                                                        {formatBDT(item.on_hold_count)}
                                                    </span>
                                                </td>
                                                <td style={{
                                                    padding: '10px',
                                                    border: '1px solid #dee2e6',
                                                    textAlign: 'right',
                                                    fontWeight: '600',
                                                    color: '#dc3545'
                                                }}>
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '3px',
                                                        backgroundColor: '#f8d7da',
                                                        color: '#721c24'
                                                    }}>
                                                        {formatBDT(item.closed_count)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Total Row */}
                                        {selectedTicketSummary.length > 0 && (
                                            <tr style={{
                                                backgroundColor: '#e3f2fd',
                                                fontWeight: 'bold',
                                                borderTop: '2px solid #1976d2'
                                            }}>
                                                <td colSpan="3" style={{
                                                    padding: '10px',
                                                    border: '1px solid #dee2e6',
                                                    textAlign: 'right'
                                                }}>Total:</td>
                                                <td style={{
                                                    padding: '10px',
                                                    border: '1px solid #dee2e6',
                                                    textAlign: 'right',
                                                    color: '#1976d2'
                                                }}>
                                                    {formatBDT(selectedTicketSummary.reduce((sum, item) => sum + (Number(item.total_tickets) || 0), 0))}
                                                </td>
                                                <td style={{
                                                    padding: '10px',
                                                    border: '1px solid #dee2e6',
                                                    textAlign: 'right',
                                                    color: '#28a745'
                                                }}>
                                                    {formatBDT(selectedTicketSummary.reduce((sum, item) => sum + (Number(item.open_count) || 0), 0))}
                                                </td>
                                                <td style={{
                                                    padding: '10px',
                                                    border: '1px solid #dee2e6',
                                                    textAlign: 'right',
                                                    color: '#ffc107'
                                                }}>
                                                    {formatBDT(selectedTicketSummary.reduce((sum, item) => sum + (Number(item.on_hold_count) || 0), 0))}
                                                </td>
                                                <td style={{
                                                    padding: '10px',
                                                    border: '1px solid #dee2e6',
                                                    textAlign: 'right',
                                                    color: '#dc3545'
                                                }}>
                                                    {formatBDT(selectedTicketSummary.reduce((sum, item) => sum + (Number(item.closed_count) || 0), 0))}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{
                                    padding: '40px',
                                    textAlign: 'center',
                                    color: '#666'
                                }}>
                                    <i className="fa-solid fa-inbox" style={{ fontSize: '48px', color: '#ddd', marginBottom: '15px' }}></i>
                                    <p style={{ margin: 0 }}>No ticket summary available</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            marginTop: '20px',
                            paddingTop: '15px',
                            borderTop: '1px solid #e0e0e0',
                            textAlign: 'right'
                        }}>
                            <button
                                onClick={() => setShowTicketSummaryModal(false)}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '4px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                            >
                                <i className="fa-solid fa-times" style={{ marginRight: '6px' }}></i>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesSummaryReportPage;