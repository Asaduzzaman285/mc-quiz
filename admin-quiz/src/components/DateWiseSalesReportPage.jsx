import React, { useState, useEffect } from 'react';
import Paginate from './Paginate';
import { FaHome } from 'react-icons/fa';
import Select from 'react-select';
import SkeletonLoader from './SkeletonLoader';
import { hasPermission } from '../utils/permissions';

const BASE_URL = `${import.meta.env.VITE_APP_API_BASE_URL}/api/v1/date-wise-sales-report`;
const FILTER_DATA_URL = `${import.meta.env.VITE_APP_API_BASE_URL}/api/v1/summary-report/filter-data`;

const DateWiseSalesReportPage = ({ sidebarVisible = false }) => {
    const [reports, setReports] = useState([]);
    const [searchMerchant, setSearchMerchant] = useState('');
    const [searchDateFrom, setSearchDateFrom] = useState('');
    const [searchDateTo, setSearchDateTo] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertVariant, setAlertVariant] = useState('success');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [filterOptions, setFilterOptions] = useState({
        merchant_list: []
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

    const handleDateChange = (setter) => (e) => {
        setter(e.target.value);
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
    };

    const formatReportDate = (dateStr) => {
        if (!dateStr) return '-';
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
    };

    const formatBDT = (number) => {
        const num = Math.round(Number(number));
        if (Number.isNaN(num)) return '0';
        return num.toLocaleString('en-IN');
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
                window.location.href = '/login';
            }, 2000);
            return true;
        }
        return false;
    };

    // Fetch filter options and reports on mount
    useEffect(() => {
        fetchFilterOptions();
        fetchReports();
    }, []);

    // Fetch filter options
    const fetchFilterOptions = async () => {
        try {
            setFilterOptionsLoading(true);
            const response = await fetch(FILTER_DATA_URL, {
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

    // Fetch reports with server-side pagination and filtering
    const fetchReports = async (page = currentPage, filters = null) => {
        try {
            setLoading(true);

            const queryParams = new URLSearchParams();
            queryParams.append('page', page);

            // Use passed filters or fall back to current state
            const merchant = filters !== null ? filters.merchant : searchMerchant;
            const dateFrom = filters !== null ? filters.dateFrom : searchDateFrom;
            const dateTo = filters !== null ? filters.dateTo : searchDateTo;

            if (merchant) queryParams.append('merchant_id', merchant);
            if (dateFrom) queryParams.append('start_date', dateFrom);
            if (dateTo) queryParams.append('end_date', dateTo);

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
        setSearchMerchant('');
        setSearchDateFrom('');
        setSearchDateTo('');
        setCurrentPage(1);

        // Pass empty filters directly
        fetchReports(1, {
            merchant: '',
            dateFrom: '',
            dateTo: ''
        });
    };

    // Handle apply filter
    const handleFilter = () => {
        setCurrentPage(1);
        fetchReports(1, {
            merchant: searchMerchant,
            dateFrom: searchDateFrom,
            dateTo: searchDateTo
        });
    };

    // Handle download report
    const handleDownloadReport = async () => {
        try {
            setDownloading(true);

            const queryParams = new URLSearchParams();
            if (searchMerchant) queryParams.append('merchant_id', searchMerchant);
            if (searchDateFrom) queryParams.append('start_date', searchDateFrom);
            if (searchDateTo) queryParams.append('end_date', searchDateTo);

            const queryString = queryParams.toString();
            const url = `${BASE_URL}/report-download${queryString ? `?${queryString}` : ''}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (handleUnauthorized(response)) return;

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status} ${response.statusText}`);
            }

            // Get the filename from content-disposition header or use default
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'date-wise-sales-report.csv';
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+)"?/);
                if (match) filename = match[1];
            }

            // Create blob and download link
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            showAlert('Report downloaded successfully', 'success');
        } catch (error) {
            console.error('Error downloading report:', error);
            showAlert(error.message || 'Failed to download report', 'danger');
        } finally {
            setDownloading(false);
        }
    };

    const handlePageChange = (page) => {
        fetchReports(page);
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
                <h1>Date Wise Sales Report</h1>
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
                    <span>Date Wise Sales Report</span>
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
                        <SkeletonLoader type="filter" count={3} />
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
                                /* Buttons (4th and 5th items) span 1 column */
                                .filter-grid > div:nth-child(4),
                                .filter-grid > div:nth-child(5) {
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
                                    value={searchMerchant ? filterOptions.merchant_list.find(m => m.value.toString() === searchMerchant.toString()) : null}
                                    onChange={(selectedOption) => setSearchMerchant(selectedOption ? selectedOption.value : '')}
                                    options={[
                                        { value: '', label: 'All Partners' },
                                        ...filterOptions.merchant_list
                                    ]}
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
                                    placeholder="All Partners"
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
                                            } catch (err) {
                                                // Ignore errors
                                            }
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
                                            } catch (err) {
                                                // Ignore errors
                                            }
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
                {/* Action Buttons Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {hasPermission("date wise sales report download") && (
                            <button
                                onClick={handleDownloadReport}
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
                                        <i className="fa-solid fa-download" style={{ marginRight: '6px', fontSize: '12px' }}></i>
                                        Download Report
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table
                        className="table table-bordered table-hover table-sm align-middle"
                        style={{ fontSize: "12px", lineHeight: "1.8", minWidth: '100%' }}
                    >
                        <thead className="table-light">
                            <tr>
                                <th className="py-2 px-3 fw-semibold text-center" style={{ width: "60px" }}>S/N</th>
                                <th className="py-2 px-3 fw-semibold text-start">Partner Name</th>
                                <th className="py-2 px-3 fw-semibold text-center">Date</th>
                                <th className="py-2 px-3 fw-semibold text-center">Total Sales</th>
                                <th className="py-2 px-3 fw-semibold text-end">Total Amount</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <SkeletonLoader type="table" count={5} columns={5} />
                            ) : reports.length > 0 ? (
                                reports.map((report, i) => (
                                    <tr key={`${report.merchant_id}-${report.purchase_date || 'all'}`} className="align-middle">
                                        <td className="py-1 px-3 text-center">
                                            {paginator?.current_page > 1
                                                ? (paginator?.current_page - 1) * paginator?.record_per_page + i + 1
                                                : i + 1}
                                        </td>

                                        <td className="py-1 px-3">
                                            {report.merchant_name || 'N/A'}
                                            {/* {report.merchant_id
                                                // <span style={{ fontSize: '10px', color: '#666', marginLeft: '5px' }}>
                                                //     (ID: {report.merchant_id})
                                                // </span>
                                            } */}
                                        </td>

                                        <td className="py-1 px-3 text-center">
                                            {report.purchase_date ? formatReportDate(report.purchase_date) : 'All Time'}
                                        </td>

                                        <td className="py-1 px-3 text-center">
                                            <span
                                                style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    backgroundColor: '#e3f2fd',
                                                    color: '#1976d2',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                {formatBDT(report.total_sales || 0)}
                                            </span>
                                        </td>

                                        <td className="py-1 px-3 text-end fw-bold" style={{ color: '#28a745' }}>
                                            ৳{parseFloat(report.total_amount || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted py-3">
                                        {searchMerchant || searchDateFrom || searchDateTo
                                            ? "No sales data found matching your filters"
                                            : "No sales data available"}
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
            `}</style>
        </div>
    );
};

export default DateWiseSalesReportPage;