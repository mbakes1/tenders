import React from 'react';
import { 
  Shield, 
  Database, 
  Users, 
  Bookmark, 
  RefreshCw, 
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Server,
  Calendar,
  BarChart3,
  Zap,
  Download,
  Settings,
  Eye,
  AlertCircle as AlertIcon
} from 'lucide-react';
import { useAdminStats, useRecentActivity } from '../../lib/queries';
import { performHealthCheck, triggerDataSync, triggerFullResync, getSyncStatistics } from '../../lib/supabase';

const AdminDashboard: React.FC = () => {
  const [healthStatus, setHealthStatus] = React.useState<any>(null);
  const [syncing, setSyncing] = React.useState(false);
  const [fullSyncing, setFullSyncing] = React.useState(false);
  const [syncStats, setSyncStats] = React.useState<any>(null);
  const [lastRefresh, setLastRefresh] = React.useState<Date>(new Date());

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
  } = useRecentActivity(15);

  const loading = statsLoading || activityLoading;
  const error = statsError ? (statsErrorMessage instanceof Error ? statsErrorMessage.message : 'Failed to load admin data') : null;

  // Load initial data on mount
  React.useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        checkHealth(),
        loadSyncStats()
      ]);
    };
    initializeData();
  }, []);

  const checkHealth = async () => {
    try {
      const health = await performHealthCheck();
      setHealthStatus(health);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus({
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const loadSyncStats = async () => {
    try {
      const { data, error } = await getSyncStatistics();
      if (!error && data) {
        setSyncStats(data);
      }
    } catch (error) {
      console.error('Failed to load sync statistics:', error);
    }
  };

  const handleRefresh = async () => {
    setLastRefresh(new Date());
    await Promise.all([
      refetchStats(),
      refetchActivity(),
      checkHealth(),
      loadSyncStats()
    ]);
  };

  const handleIncrementalSync = async () => {
    setSyncing(true);
    try {
      const result = await triggerDataSync();
      if (result.success) {
        // Show success notification
        const message = `${result.syncType || 'Incremental'} sync completed! Fetched ${result.data?.stats?.totalFetched || 0} tenders.`;
        alert(message);
        await handleRefresh();
      } else {
        alert(`Sync failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Incremental sync error:', error);
      alert('Sync failed. Please check the console for details.');
    } finally {
      setSyncing(false);
    }
  };

  const handleFullResync = async () => {
    if (!confirm('Full resync will take several minutes and may impact performance. Continue?')) {
      return;
    }
    
    setFullSyncing(true);
    try {
      const result = await triggerFullResync();
      if (result.success) {
        const message = `Full resync completed! Processed ${result.data?.stats?.totalFetched || 0} tenders.`;
        alert(message);
        await handleRefresh();
      } else {
        alert(`Full resync failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Full resync error:', error);
      alert('Full resync failed. Please check the console for details.');
    } finally {
      setFullSyncing(false);
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

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getHealthStatusConfig = (status: string) => {
    switch (status) {
      case 'healthy':
        return {
          color: 'text-green-600',
          bg: 'bg-green-100',
          border: 'border-green-200',
          icon: CheckCircle
        };
      case 'warning':
        return {
          color: 'text-amber-600',
          bg: 'bg-amber-100',
          border: 'border-amber-200',
          icon: AlertTriangle
        };
      default:
        return {
          color: 'text-red-600',
          bg: 'bg-red-100',
          border: 'border-red-200',
          icon: AlertTriangle
        };
    }
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

  const healthConfig = healthStatus ? getHealthStatusConfig(healthStatus.status) : null;
  const HealthIcon = healthConfig?.icon || AlertTriangle;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">System overview and management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-xs text-gray-500">Last updated</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(lastRefresh.toISOString())}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Health */}
      {healthStatus && (
        <div className={`bg-white rounded-lg border p-6 ${healthConfig?.border || 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${healthConfig?.bg || 'bg-gray-100'}`}>
                <HealthIcon className={`w-4 h-4 ${healthConfig?.color || 'text-gray-600'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">System Health</h3>
                <p className={`text-sm ${healthConfig?.color || 'text-gray-600'}`}>
                  {healthStatus.message}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${healthStatus.checks?.connectivity ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Database</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${healthStatus.checks?.statistics ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Functions</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tenders</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.total_tenders)}
              </p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Database className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Tenders</p>
              <p className="text-2xl font-bold text-green-600">
                {formatNumber(stats?.open_tenders)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Currently active</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Closing Soon</p>
              <p className="text-2xl font-bold text-amber-600">
                {formatNumber(stats?.closing_soon)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Next 7 days</p>
            </div>
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookmarks</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatNumber(stats?.total_bookmarks)}
              </p>
              <p className="text-xs text-gray-500 mt-1">User engagement</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bookmark className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Sync Management */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sync Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Data Synchronization</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Incremental Sync</h4>
                <p className="text-sm text-gray-600">Fetch recent changes and new tenders</p>
              </div>
              <button
                onClick={handleIncrementalSync}
                disabled={syncing || fullSyncing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {syncing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Full Resync</h4>
                <p className="text-sm text-gray-600">Complete data refresh (takes 3-5 minutes)</p>
              </div>
              <button
                onClick={handleFullResync}
                disabled={syncing || fullSyncing}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {fullSyncing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Database className="w-4 h-4" />
                )}
                <span>{fullSyncing ? 'Resyncing...' : 'Full Resync'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sync Statistics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Sync Performance</h3>
          </div>
          
          {syncStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Last Sync</p>
                  <p className="font-medium text-gray-900">{formatDate(syncStats.last_sync)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sync Type</p>
                  <p className="font-medium text-gray-900 capitalize">{syncStats.sync_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Records Fetched</p>
                  <p className="font-medium text-gray-900">{formatNumber(syncStats.total_fetched)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Execution Time</p>
                  <p className="font-medium text-gray-900">{formatDuration(syncStats.execution_time_ms)}</p>
                </div>
              </div>
              
              {syncStats.api_calls_made && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">API Efficiency</span>
                    <span className="font-medium text-gray-900">
                      {Math.round(syncStats.total_fetched / syncStats.api_calls_made)} records/call
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No sync statistics available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <span className="text-sm text-gray-500">{recentActivity.length} recent events</span>
        </div>
        
        {recentActivity.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activity.activity_type === 'bookmark' ? 'bg-orange-100' : 
                  activity.activity_type === 'sync' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {activity.activity_type === 'bookmark' ? (
                    <Bookmark className="w-3 h-3 text-orange-600" />
                  ) : activity.activity_type === 'sync' ? (
                    <RefreshCw className="w-3 h-3 text-blue-600" />
                  ) : (
                    <Activity className="w-3 h-3 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs text-gray-500">{formatDate(activity.created_at)}</p>
                    {activity.activity_type && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {activity.activity_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        )}
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <Settings className="w-4 h-4 text-gray-600" />
          </div>
          <h3 className="font-semibold text-gray-900">System Information</h3>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm text-gray-600">Database Status</p>
            <p className="font-medium text-gray-900">
              {healthStatus?.checks?.connectivity ? 'Connected' : 'Disconnected'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Data Update</p>
            <p className="font-medium text-gray-900">
              {stats?.last_updated ? formatDate(stats.last_updated) : 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="font-medium text-gray-900">
              {formatNumber(stats?.total_users)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;