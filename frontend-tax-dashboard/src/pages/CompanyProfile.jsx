import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { companies } from '../utils/api';
import Layout from '../components/Layout';
import Badge from '../components/Badge';
import Button from '../components/Button';

export default function CompanyProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    loadCompany();
  }, [id]);

  const loadCompany = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await companies.get(id);
      if (response.ok) {
        setCompany(response.data.company);
      } else {
        setError(response.error || 'Failed to load company');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12 text-text-secondary">
          Loading company details...
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      </Layout>
    );
  }

  if (!company) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-text-secondary mb-4">Company not found</p>
          <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-text-primary">
                {company.company_name}
              </h1>
              <Badge status={company.status}>{company.status}</Badge>
            </div>
            <p className="text-text-secondary">
              {company.legal_entity_type}
              {company.kbli_code && ` • KBLI: ${company.kbli_code}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="primary">Calculate Tax</Button>
            <Button variant="secondary" onClick={() => navigate('/')}>
              Back
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex gap-4">
            {['info', 'financials', 'tax', 'invoices'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="card">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow label="Company Name" value={company.company_name} />
                  <InfoRow label="Legal Entity" value={company.legal_entity_type} />
                  <InfoRow label="NPWP" value={company.npwp || '-'} />
                  <InfoRow label="KBLI Code" value={company.kbli_code || '-'} />
                  <InfoRow label="Email" value={company.email} />
                  <InfoRow label="Phone" value={company.phone || '-'} />
                </div>
              </div>

              {/* Address */}
              {company.address && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow label="Street" value={company.address} />
                    <InfoRow label="City" value={company.city || '-'} />
                    <InfoRow label="Province" value={company.province || '-'} />
                    <InfoRow label="Postal Code" value={company.postal_code || '-'} />
                  </div>
                </div>
              )}

              {/* Consultant Assignment */}
              {company.assigned_consultant_id && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Assignment</h3>
                  <InfoRow label="Assigned Consultant" value={company.assigned_consultant_id} />
                </div>
              )}

              {/* Documents */}
              {company.documents_folder_url && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Documents</h3>
                  <a
                    href={company.documents_folder_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Open Documents Folder →
                  </a>
                </div>
              )}

              {/* Internal Notes */}
              {company.internal_notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Internal Notes</h3>
                  <p className="text-text-secondary whitespace-pre-wrap">
                    {company.internal_notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'financials' && (
            <div className="text-center py-12 text-text-secondary">
              <p>Financial data will appear here</p>
              <p className="text-sm mt-2">Connect to Jurnal.id to sync financial data</p>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="text-center py-12 text-text-secondary">
              <p>Tax calculations will appear here</p>
              <Button variant="primary" className="mt-4">
                Calculate Tax
              </Button>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="text-center py-12 text-text-secondary">
              <p>Invoices will appear here</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div className="text-sm text-text-secondary mb-1">{label}</div>
      <div className="text-text-primary font-medium">{value}</div>
    </div>
  );
}
