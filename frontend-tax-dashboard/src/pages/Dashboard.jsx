import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companies } from '../utils/api';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import ClientCard from '../components/ClientCard';
import Button from '../components/Button';

export default function Dashboard() {
  const [companiesList, setCompaniesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const navigate = useNavigate();

  useEffect(() => {
    loadCompanies();
  }, [statusFilter, search]);

  const loadCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
        page: 1,
        limit: 20,
      };
      const response = await companies.list(params);
      if (response.ok) {
        setCompaniesList(response.data.companies || []);
      } else {
        setError(response.error || 'Failed to load companies');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const activeCompanies = companiesList.filter(c => c.status === 'active');
  const pendingReports = companiesList.filter(c => c.status === 'pending').length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Clients"
            value={companiesList.length}
            change={`↗ ${activeCompanies.length} active`}
          />
          <StatCard
            label="Pending Reports"
            value={pendingReports}
          />
          <StatCard
            label="Upcoming Payments"
            value="5"
          />
          <StatCard
            label="This Month Tax"
            value={<span className="money">Rp 125.5M</span>}
          />
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <input
              type="search"
              placeholder="Search by name, NPWP, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex gap-2 items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-32"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>

            <Button
              variant="primary"
              onClick={() => navigate('/companies/new')}
            >
              + New Client
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12 text-text-secondary">
            Loading companies...
          </div>
        )}

        {/* Companies List */}
        {!loading && !error && (
          <>
            {companiesList.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-text-secondary mb-4">
                  No companies found. Create your first client!
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/companies/new')}
                >
                  + New Client
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companiesList.map((company) => (
                  <ClientCard key={company.id} company={company} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
