import React, { useState, useEffect } from 'react';
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
import { supabase, performHealthCheck, triggerDataSync } from '../../lib/supabase';

interface AdminStats {
  total_users: number;
  total_tenders: number;
  open_tenders: number;
  total_views: number;
  total_bookmarks: number;
  last_sync: string;
  system_health: string;
}

interface RecentActivity {
  activity_type: string;
  description: string;
  created_at: string;
  details: any;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setError(null);
      
      // Fetch admin statistics
      const { data: adminStats, error: statsError } = await supabase
        .rpc('get_admin_stats');
      
      if (statsError) {
        throw new Error(`Failed to fetch admin stats: ${statsError.message}`);
      }
      
      setStats(adminStats?.[0] || null);

      // Fetch recent activity
      const { data: activity, error: activityError } = await supabase
        .rpc('get_recent_activity', { limit_count: 10 });
      
      if (activityError) {
        console.warn('Failed to fetch recent activity:', activityError);
        setRecentActivity([]);
      } else {
        setRecentActivity(activity || []);
      }

      // Perform health check
      const health = await performHealthCheck();
      setHealthStatus(health);

    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const result = await triggerDataSync();
      if (result.success) {
        alert('Data sync completed successfully!');
        await fetchAdminData(); // Refresh data after sync
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

  useEffect(() => {
    fetchAdminData().finally(() => setLoading(false));
  }, []);

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
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
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
                {stats ? formatNumber(stats.total_users) : '0'}
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
                {stats ? formatNumber(stats.total_tenders) : '0'}
              </p>
              <p className="text-xs text-green-600">
                {stats ? formatNumber(stats.open_tenders) : '0'} open
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
                {stats ? formatNumber(stats.total_views) : '0'}
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
                {stats ? formatNumber(stats.total_bookmarks) : '0'}
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