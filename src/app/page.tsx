'use client';

import { useState, useEffect, useMemo } from 'react';
import { CSCase } from '@/types';
import CaseList from '@/components/CaseList';
import CaseDetail from '@/components/CaseDetail';
import InfoPanel from '@/components/InfoPanel';
import Header from '@/components/Header';
import StatsBar from '@/components/StatsBar';
import { Search, X, PanelLeftClose, PanelLeft } from 'lucide-react';

export default function Dashboard() {
  const [cases, setCases] = useState<CSCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<CSCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Panel visibility states
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Get unique store codes from cases
  const uniqueStores = Array.from(new Set(cases.map(c => c.storeCode).filter(Boolean))) as string[];

  // Filter cases by store and search query (client-side)
  const filteredCases = useMemo(() => {
    let result = cases;

    // Filter by store
    if (storeFilter !== 'all') {
      result = result.filter(c => c.storeCode === storeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(c =>
        c.platformOrderNumber?.toLowerCase().includes(query) ||
        c.customerName?.toLowerCase().includes(query) ||
        c.customerEmail?.toLowerCase().includes(query) ||
        c.originalMessage?.toLowerCase().includes(query) ||
        c.issueCategory?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [cases, storeFilter, searchQuery]);

  useEffect(() => {
    fetchCases();
  }, [filter]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${encodeURIComponent(filter)}` : '';
      const response = await fetch(`/api/cases${params}`);
      const data = await response.json();
      if (data.success) {
        setCases(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    }
    setLoading(false);
  };

  const handleCaseSelect = async (caseItem: CSCase) => {
    // Fetch full case details with order info
    try {
      const response = await fetch(`/api/cases/${caseItem.id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedCase(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch case details:', error);
      setSelectedCase(caseItem);
    }
  };

  // Get current case index in filtered list
  const currentCaseIndex = selectedCase
    ? filteredCases.findIndex(c => c.id === selectedCase.id)
    : -1;

  // Navigation handlers
  const handlePrevCase = () => {
    if (currentCaseIndex > 0) {
      handleCaseSelect(filteredCases[currentCaseIndex - 1]);
    }
  };

  const handleNextCase = () => {
    if (currentCaseIndex < filteredCases.length - 1) {
      handleCaseSelect(filteredCases[currentCaseIndex + 1]);
    }
  };

  const handleSubmitAndNext = () => {
    // Move to next case after submit (the update is handled in CaseDetail)
    if (currentCaseIndex < filteredCases.length - 1) {
      handleCaseSelect(filteredCases[currentCaseIndex + 1]);
    }
  };

  const handleCaseUpdate = async (id: string, updates: Partial<CSCase>) => {
    try {
      const response = await fetch(`/api/cases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (data.success) {
        setSelectedCase(data.data);
        fetchCases(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to update case:', error);
    }
  };

  const stats = {
    newCases: filteredCases.filter(c => c.status === 'New').length,
    inProgressCases: filteredCases.filter(c => c.status === 'In Progress').length,
    pendingCases: filteredCases.filter(c => c.status === 'Pending Customer' || c.status === 'Pending Internal').length,
    resolvedToday: filteredCases.filter(c => {
      if (c.status !== 'Resolved' || !c.resolvedAt) return false;
      const today = new Date().toISOString().split('T')[0];
      return c.resolvedAt.startsWith(today);
    }).length,
    avgResponseTime: 0, // TODO: Calculate from actual data
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <StatsBar stats={stats} />

      <div className="flex h-[calc(100vh-140px)]">
        {/* Left Panel - Case List */}
        {leftPanelOpen ? (
          <div className="w-80 border-r border-gray-200 bg-white overflow-hidden flex flex-col">
            {/* Panel Header with Close Button */}
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Cases ({filteredCases.length})</span>
              <button
                onClick={() => setLeftPanelOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition"
                title="Collapse case list"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            {/* Search & Filters */}
            <div className="p-3 border-b border-gray-200 space-y-2">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order #, name..."
                  className="w-full pl-9 pr-8 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Filters Row */}
              <div className="flex space-x-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="New">New</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending Customer">Pending</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Escalated">Escalated</option>
                </select>
                {uniqueStores.length > 0 && (
                  <select
                    value={storeFilter}
                    onChange={(e) => setStoreFilter(e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Stores</option>
                    {uniqueStores.sort().map(store => (
                      <option key={store} value={store}>
                        {store} ({cases.filter(c => c.storeCode === store).length})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <CaseList
              cases={filteredCases}
              selectedCaseId={selectedCase?.id}
              onSelectCase={handleCaseSelect}
              loading={loading}
            />
          </div>
        ) : (
          /* Collapsed Left Panel */
          <div className="w-10 bg-white border-r border-gray-200 flex flex-col items-center py-3">
            <button
              onClick={() => setLeftPanelOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              title="Show case list"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
            <div className="mt-3 flex flex-col items-center">
              <span className="text-xs font-medium text-gray-600">{filteredCases.length}</span>
              <span className="text-xs text-gray-400">cases</span>
            </div>
          </div>
        )}

        {/* Center - Case Detail / Work Area */}
        <div className="flex-1 overflow-hidden">
          {selectedCase ? (
            <CaseDetail
              caseData={selectedCase}
              onUpdate={handleCaseUpdate}
              onPrevCase={handlePrevCase}
              onNextCase={handleNextCase}
              hasPrevCase={currentCaseIndex > 0}
              hasNextCase={currentCaseIndex < filteredCases.length - 1}
              currentIndex={currentCaseIndex}
              totalCases={filteredCases.length}
              onSubmitAndNext={handleSubmitAndNext}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="mt-2">Select a case to view details</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Info Panel */}
        {selectedCase && (
          <InfoPanel
            caseData={selectedCase}
            isOpen={rightPanelOpen}
            onToggle={() => setRightPanelOpen(!rightPanelOpen)}
          />
        )}
      </div>
    </div>
  );
}
