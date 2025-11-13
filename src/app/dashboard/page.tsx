'use client';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    useReactTable,
    VisibilityState,
    SortingState,
    ColumnFiltersState
} from '@tanstack/react-table';
import {
    Search,
    Filter,
    Download,
    ChevronDown,
    ChevronUp,
    X,
    Building2,
    Mail,
    Globe,
    Users,
    DollarSign,
    ExternalLink
} from 'lucide-react';

interface Lead {
    first_name: string;
    last_name: string;
    title: string;
    company: string;
    industry: string;
    email: string;
    email_status: string;
    country: string;
    city: string;
    state: string;
    employee_count: number;
    annual_revenue: number;
    company_phone: string;
    person_linkedin_url: string;
    website: string;
    lead_status: string;
    company_founded_year: number;
}

export default function Dashboard() {
    // ALL HOOKS AT TOP - UNCONDITIONAL
    const { data: session, status } = useSession();
    const router = useRouter();
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize] = useState(50);
    const [showFilters, setShowFilters] = useState(false);

    const [searchInput, setSearchInput] = useState(''); // Local input state
    const [industryFilter, setIndustryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [countryFilter, setCountryFilter] = useState('all');
    const [leadStatusFilter, setLeadStatusFilter] = useState('all');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setGlobalFilter(searchInput);
        }, 500); // Wait 500ms after user stops typing
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Fetch data with server-side pagination
    const { data: apiResponse, isLoading, isFetching } = useQuery({
        queryKey: ['leads', pageIndex, pageSize, globalFilter, industryFilter, statusFilter, countryFilter, leadStatusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: (pageIndex + 1).toString(),
                limit: pageSize.toString(),
                search: globalFilter,
                industry: industryFilter !== 'all' ? industryFilter : '',
                email_status: statusFilter !== 'all' ? statusFilter : '',
                country: countryFilter !== 'all' ? countryFilter : '',
                lead_status: leadStatusFilter !== 'all' ? leadStatusFilter : '',
            });
            const res = await fetch(`/api/leads?${params}`);
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        },
        placeholderData: (previousData) => previousData,
        enabled: status === 'authenticated' && !!session,
        refetchOnWindowFocus: false,
        staleTime: 300000, // 5 minutes
        gcTime: 600000, // 10 minutes (renamed from cacheTime)
    });

    // Extract without shadowing (use apiResponse directly)
    const leadsData = apiResponse?.data || [];
    const total = apiResponse?.total || 0;

    // Fetch all unique values for filters (separate query)
    const { data: filtersData } = useQuery({
        queryKey: ['lead-filters'],
        queryFn: async () => {
            try {
                const res = await fetch('/api/leads/filters');
                if (!res.ok) return null; // Silently fail, use fallback
                return res.json();
            } catch (error) {
                // Silently fail and use fallback extraction from data
                return null;
            }
        },
        enabled: status === 'authenticated' && !!session,
        staleTime: 3600000, // 1 hour
        gcTime: 7200000, // 2 hours (renamed)
        retry: false, // Don't retry if endpoint doesn't exist
    });

    // Fetch stats
    const { data: statsData } = useQuery({
        queryKey: ['lead-stats', globalFilter, industryFilter, statusFilter, countryFilter, leadStatusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                search: globalFilter,
                industry: industryFilter !== 'all' ? industryFilter : '',
                email_status: statusFilter !== 'all' ? statusFilter : '',
                country: countryFilter !== 'all' ? countryFilter : '',
                lead_status: leadStatusFilter !== 'all' ? leadStatusFilter : '',
            });
            const res = await fetch(`/api/leads/stats?${params}`);
            if (!res.ok) return { totalLeads: 0, verifiedEmails: 0, uniqueCompanies: 0, avgRevenue: 0 };
            return res.json();
        },
        enabled: status === 'authenticated' && !!session,
        staleTime: 300000, // 5 minutes
        gcTime: 600000, // 10 minutes (renamed)
    });

    // Redirect effect
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Reset to first page when filters change
    useEffect(() => {
        setPageIndex(0);
    }, [globalFilter, industryFilter, statusFilter, countryFilter, leadStatusFilter]);

    // Fallback: Extract unique values from current data if API fails
    const uniqueIndustries = useMemo(() => {
        if (filtersData?.industries) {
            return ['all', ...filtersData.industries];
        }
        // Fallback to extracting from all available data
        const allIndustries = leadsData.map((lead: Lead) => lead.industry).filter(Boolean);
        return ['all', ...Array.from(new Set(allIndustries)).sort()];
    }, [filtersData, leadsData]);

    const uniqueStatuses = useMemo(() => {
        if (filtersData?.statuses) {
            return ['all', ...filtersData.statuses];
        }
        const allStatuses = leadsData.map((lead: Lead) => lead.email_status).filter(Boolean);
        return ['all', ...Array.from(new Set(allStatuses)).sort()];
    }, [filtersData, leadsData]);

    const uniqueCountries = useMemo(() => {
        if (filtersData?.countries) {
            return ['all', ...filtersData.countries];
        }
        const allCountries = leadsData.map((lead: Lead) => lead.country).filter(Boolean);
        return ['all', ...Array.from(new Set(allCountries)).sort()];
    }, [filtersData, leadsData]);

    const uniqueLeadStatuses = useMemo(() => {
        if (filtersData?.leadStatuses) {
            return ['all', ...filtersData.leadStatuses];
        }
        const allLeadStatuses = leadsData.map((lead: Lead) => lead.lead_status).filter(Boolean);
        return ['all', ...Array.from(new Set(allLeadStatuses)).sort()];
    }, [filtersData, leadsData]);

    // Columns (unchanged)
    const columns: ColumnDef<Lead>[] = [
        {
            accessorKey: 'first_name',
            header: 'Name',
            cell: ({ row }) => {
                const name = `${row.getValue('first_name')} ${row.original.last_name}`;
                return (
                    <div className="flex flex-col min-w-[180px]">
                        <span className="font-medium text-white">{name}</span>
                        <span className="text-xs text-gray-400 truncate">{row.original.title}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'company',
            header: 'Company',
            cell: ({ row }) => (
                <div className="flex flex-col min-w-[180px]">
                    <span className="font-medium text-white flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{row.getValue('company')}</span>
                    </span>
                    <span className="text-xs text-gray-400 truncate">{row.original.industry}</span>
                </div>
            ),
        },
        {
            accessorKey: 'email',
            header: 'Contact',
            cell: ({ row }) => (
                <div className="flex flex-col gap-1 min-w-[200px]">
                    <a href={`mailto:${row.getValue('email')}`} className="text-blue-400 hover:underline text-sm flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{row.getValue('email')}</span>
                    </a>
                    <Badge variant={row.original.email_status === 'Verified' ? 'default' : 'secondary'} className="w-fit text-xs">
                        {row.original.email_status}
                    </Badge>
                </div>
            ),
        },
        {
            accessorKey: 'location',
            header: 'Location',
            cell: ({ row }) => (
                <div className="text-sm min-w-[140px]">
                    <div className="text-white truncate">{row.original.city}{row.original.state && `, ${row.original.state}`}</div>
                    <div className="text-gray-400 text-xs">{row.original.country}</div>
                </div>
            ),
        },
        {
            accessorKey: 'employee_count',
            header: 'Employees',
            cell: ({ row }) => (
                <div className="flex items-center gap-1 text-sm">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span>{row.getValue('employee_count')?.toLocaleString() || 'N/A'}</span>
                </div>
            ),
        },
        {
            accessorKey: 'annual_revenue',
            header: 'Revenue',
            cell: ({ row }) => {
                const revenue = row.getValue('annual_revenue') as number;
                return revenue ? (
                    <div className="flex items-center gap-1 text-sm text-green-400">
                        <DollarSign className="w-3 h-3" />
                        <span>${(revenue / 1000000).toFixed(1)}M</span>
                    </div>
                ) : <span className="text-gray-500 text-sm">N/A</span>;
            },
        },
        {
            accessorKey: 'website',
            header: 'Links',
            cell: ({ row }) => (
                <div className="flex gap-2">
                    {row.original.website && (
                        <a
                            href={row.original.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                            title="Visit website"
                        >
                            <Globe className="w-4 h-4" />
                        </a>
                    )}
                    {row.original.person_linkedin_url && (
                        <a
                            href={row.original.person_linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                            title="LinkedIn Profile"
                        >
                            <ExternalLink className="w-4 h-4" />  {/* Use ExternalLink for simplicity */}
                        </a>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'lead_status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant="outline" className="capitalize">
                    {row.original.lead_status}
                </Badge>
            ),
        }
    ];

    // Table: Always called with dummy data on load
    const table = useReactTable({
        data: isLoading ? [] : leadsData,  // Use leadsData to avoid shadowing
        columns,
        state: {
            columnVisibility,
            sorting,
            columnFilters,
            globalFilter,
            pagination: { pageIndex, pageSize }
        },
        onColumnVisibilityChange: setColumnVisibility,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: (updater) => setPageIndex(typeof updater === 'function' ? updater({ pageIndex, pageSize }).pageIndex : updater.pageIndex),
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: true,  // Server-side for efficiency
        manualSorting: true,  // Server-side sorting if API supports
        pageCount: Math.ceil(total / pageSize),
        columnResizeMode: 'onChange',
    });

    const clearFilters = () => {
        setIndustryFilter('all');
        setStatusFilter('all');
        setCountryFilter('all');
        setLeadStatusFilter('all');
        setSearchInput(''); // Clear input field
        setGlobalFilter(''); // Clear search filter
    };

    const exportToCSV = async () => {
        try {
            // Export all filtered data, not just current page
            const params = new URLSearchParams({
                page: '1',
                limit: total.toString(), // Get all results
                search: globalFilter,
                industry: industryFilter !== 'all' ? industryFilter : '',
                email_status: statusFilter !== 'all' ? statusFilter : '',
                country: countryFilter !== 'all' ? countryFilter : '',
                lead_status: leadStatusFilter !== 'all' ? leadStatusFilter : '',
            });

            const res = await fetch(`/api/leads?${params}`);
            if (!res.ok) throw new Error('Failed to fetch all data');
            const { data: allData } = await res.json();

            const csvHeaders = ['First Name', 'Last Name', 'Title', 'Email', 'Company', 'Industry', 'City', 'State', 'Country', 'Employees', 'Revenue'];
            const csvRows = allData.map((lead: Lead) => [
                lead.first_name,
                lead.last_name,
                lead.title,
                lead.email,
                lead.company,
                lead.industry,
                lead.city,
                lead.state,
                lead.country,
                lead.employee_count,
                lead.annual_revenue
            ].map(val => `"${val || ''}"`).join(','));

            const csv = [csvHeaders.join(','), ...csvRows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `imagini-leads-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data. Please try again.');
        }
    };

    const handlePreviousPage = () => {
        if (pageIndex > 0) {
            setPageIndex(pageIndex - 1);
        }
    };

    const handleNextPage = () => {
        if (pageIndex < Math.ceil(total / pageSize) - 1) {
            setPageIndex(pageIndex + 1);
        }
    };

    const handleFirstPage = () => {
        setPageIndex(0);
    };

    const handleLastPage = () => {
        setPageIndex(Math.ceil(total / pageSize) - 1);
    };

    const pageCount = Math.ceil(total / pageSize);
    const canPreviousPage = pageIndex > 0;
    const canNextPage = pageIndex < pageCount - 1;

    // RENDER - AFTER ALL HOOKS/TABLE
    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-lg text-gray-300">Loading leads...</div>
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
            {/* Header */}
            <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl">🖼️</div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                                Imagini
                            </h1>
                            <p className="text-xs text-gray-400">Lead Management Dashboard</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-400">Welcome back</p>
                            <p className="text-sm font-medium">{session?.user?.name}</p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="border-gray-700 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        >
                            Logout
                        </Button>
                    </div>
                </div>
            </header>
            <div className="container mx-auto px-6 py-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Total Leads</p>
                                    <p className="text-2xl font-bold text-white">{statsData?.totalLeads || total}</p>
                                </div>
                                <Users className="w-8 h-8 text-blue-400 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Verified Emails</p>
                                    <p className="text-2xl font-bold text-white">
                                        {statsData?.verifiedEmails || 0}
                                    </p>
                                </div>
                                <Mail className="w-8 h-8 text-green-400 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Companies</p>
                                    <p className="text-2xl font-bold text-white">
                                        {statsData?.uniqueCompanies || 0}
                                    </p>
                                </div>
                                <Building2 className="w-8 h-8 text-purple-400 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Avg Revenue</p>
                                    <p className="text-2xl font-bold text-white">
                                        ${((statsData?.avgRevenue || 0) / 1000000).toFixed(1)}M
                                    </p>
                                </div>
                                <DollarSign className="w-8 h-8 text-orange-400 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {/* Search and Filters */}
                <Card className="border-gray-800 bg-black/40 backdrop-blur-sm mb-4">
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="relative flex-1 min-w-[300px]">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search by name, email, company..."
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        className="pl-10 bg-gray-900/50 border-gray-700 focus:border-green-500"
                                    />
                                    {searchInput && (
                                        <button
                                            onClick={() => {
                                                setSearchInput('');
                                                setGlobalFilter('');
                                            }}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="border-gray-700 hover:bg-gray-800"
                                >
                                    <Filter className="w-4 h-4 mr-2" />
                                    Filters
                                    {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={exportToCSV}
                                    disabled={isFetching}
                                    className="border-gray-700 hover:bg-gray-800 text-green-400"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export CSV
                                </Button>
                            </div>
                            {showFilters && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-800">
                                    <Select value={industryFilter} onValueChange={setIndustryFilter}>
                                        <SelectTrigger className="bg-gray-900/50 border-gray-700">
                                            <SelectValue placeholder="Select Industry" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {uniqueIndustries.length > 1 ? (
                                                uniqueIndustries.map(ind => (
                                                    <SelectItem key={ind} value={ind}>
                                                        {ind === 'all' ? '🏭 All Industries' : ind}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="all" disabled>No industries found</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="bg-gray-900/50 border-gray-700">
                                            <SelectValue placeholder="Select Email Status" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {uniqueStatuses.length > 1 ? (
                                                uniqueStatuses.map(status => (
                                                    <SelectItem key={status} value={status}>
                                                        {status === 'all' ? '✉️ All Statuses' : status}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="all" disabled>No statuses found</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Select value={countryFilter} onValueChange={setCountryFilter}>
                                        <SelectTrigger className="bg-gray-900/50 border-gray-700">
                                            <SelectValue placeholder="Select Country" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {uniqueCountries.length > 1 ? (
                                                uniqueCountries.map(country => (
                                                    <SelectItem key={country} value={country}>
                                                        {country === 'all' ? '🌍 All Countries' : country}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="all" disabled>No countries found</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
                                        <SelectTrigger className="bg-gray-900/50 border-gray-700">
                                            <SelectValue placeholder="Select Lead Status" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {uniqueLeadStatuses.length > 1 ? (
                                                uniqueLeadStatuses.map(status => (
                                                    <SelectItem key={status} value={status}>
                                                        {status === 'all' ? '📊 All Lead Statuses' : status}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="all" disabled>No lead statuses found</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {(industryFilter !== 'all' || statusFilter !== 'all' || countryFilter !== 'all' || leadStatusFilter !== 'all' || searchInput) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="text-gray-400 hover:text-white w-fit"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Clear all filters
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
                {/* Table */}
                <Card className="border-gray-800 bg-black/40 backdrop-blur-sm relative">
                    <CardContent className="p-0">
                        {isFetching && (
                            <div className="absolute top-4 right-4 z-10">
                                <div className="flex items-center gap-2 bg-gray-900 px-3 py-2 rounded-lg border border-gray-700">
                                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm text-gray-300">Loading...</span>
                                </div>
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-900/50 sticky top-0">
                                    {table.getHeaderGroups().map(headerGroup => (
                                        <tr key={headerGroup.id} className="border-b border-gray-800">
                                            {headerGroup.headers.map(header => (
                                                <th
                                                    key={header.id}
                                                    className="text-left text-gray-300 font-semibold px-4 py-3 cursor-pointer hover:text-white transition-colors"
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                        {{
                                                            asc: <ChevronUp className="w-4 h-4 text-green-400" />,
                                                            desc: <ChevronDown className="w-4 h-4 text-green-400" />,
                                                        }[header.column.getIsSorted() as string] ?? null}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map(row => (
                                            <tr
                                                key={row.id}
                                                className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors"
                                            >
                                                {row.getVisibleCells().map(cell => (
                                                    <td key={cell.id} className="px-4 py-4">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={columns.length} className="h-32 text-center text-gray-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Search className="w-12 h-12 text-gray-600" />
                                                    <p>No leads found matching your filters.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="border-t border-gray-800 bg-gray-900/30 p-4 flex justify-between items-center flex-wrap gap-4">
                            <div className="text-sm text-gray-400">
                                Showing <span className="text-white font-medium">{pageIndex * pageSize + 1}</span> to{' '}
                                <span className="text-white font-medium">{Math.min((pageIndex + 1) * pageSize, total)}</span> of{' '}
                                <span className="text-white font-medium">{total.toLocaleString()}</span> leads
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleFirstPage}
                                    disabled={!canPreviousPage || isFetching}
                                    className="border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
                                >
                                    First
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePreviousPage}
                                    disabled={!canPreviousPage || isFetching}
                                    className="border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-gray-400 px-3">
                                    Page <span className="text-white font-medium">{pageIndex + 1}</span> of{' '}
                                    <span className="text-white font-medium">{pageCount}</span>
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNextPage}
                                    disabled={!canNextPage || isFetching}
                                    className="border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
                                >
                                    Next
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLastPage}
                                    disabled={!canNextPage || isFetching}
                                    className="border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
                                >
                                    Last
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
