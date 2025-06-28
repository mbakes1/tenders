import React from 'react';
import { 
  Shield, 
  Database, 
  Users, 
  Eye, 
  Bookmark, 
  RefreshCw, 
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Server
} from 'lucide-react';
import { useAdminStats, useRecentActivity } from '../../lib/queries';
import { performHealthCheck, triggerDataSync } from '../../lib/supabase';

const AdminDashboard: React.FC = () => {
  const [healthStatus, setHealthStatus] = React.useState<any>(null);
  const [syncing, setSyncing] = React.useState(false);

  // Use TanStack Query for data fetching
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorMessage,
    refetch: refetchStats
  } = useAdminStats();

  const {
    data: recentActivity = [],
    isLoading: activityLoading,
    refetch: refetchActivity
  } = useRecentActivity(10);

  const loading = statsLoading || activityLoading;
  const error = statsError ? (statsErrorMessage instanceof Error ? statsErrorMessage.message : 'Failed to load admin data') : null;

  // Perform health check on mount
  React.useEffect(() => {
    const checkHealth = async () => {
      const health = await performHealthCheck();
      setHealthStatus(health);
    };
    checkHealth();
  }, []);

  const handleRefresh = async () => {
    await Promise.all([
      refetchStats(),
      refetchActivity()
    ]);
    
    // Refresh health check
    const health = await performHealthCheck();
    setHealthStatus(health);
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const result = await triggerDataSync();
      if (result.success) {
        alert('Data sync completed successfully!');
        await handleRefresh(); // Refresh data after sync
      } else {
        alert('Data sync failed. Please check the logs.');
      }
    } catch (error) {
      console.error('Manual sync error:', error);
      alert('Data sync failed. Please try again later.');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-lg border border-red-200 p-8 max-w-md mx-auto">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">System overview and management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {syncing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Database className="w-4 h-4" />
              )}
              <span>Sync Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Health */}
      {healthStatus && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                healthStatus.status === 'healthy' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {healthStatus.status === 'healthy' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">System Health</h3>
                <p className={`text-sm ${
                  healthStatus.status === 'healthy' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {healthStatus.message}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Server className="w-4 h-4" />
                <span>Database: {healthStatus.checks?.connectivity ? 'Connected' : 'Error'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Activity className="w-4 h-4" />
                <span>Functions: {healthStatus.checks?.statistics ? 'Working' : 'Error'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.total_users ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Database className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Tenders</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.total_tenders ?? 0)}
              </p>
              <p className="text-xs text-green-600">
                {formatNumber(stats?.open_tenders ?? 0)} open
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.total_views ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Bookmark className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Bookmarks</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.total_bookmarks ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Last Sync Info */}
      {stats?.last_sync && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Last Data Sync</h3>
              <p className="text-sm text-gray-600">
                {formatDate(stats.last_sync)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
        </div>
        
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activity.activity_type === 'tender_view' ? 'bg-blue-100' : 'bg-orange-100'
                }`}>
                  {activity.activity_type === 'tender_view' ? (
                    <Eye className="w-3 h-3 text-blue-600" />
                  ) : (
                    <Bookmark className="w-3 h-3 text-orange-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                  <p className="text-xs text-gray-500">{formatDate(activity.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;