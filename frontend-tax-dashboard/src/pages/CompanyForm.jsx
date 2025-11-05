import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companies } from '../utils/api';
import Layout from '../components/Layout';
import Button from '../components/Button';

export default function CompanyForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    company_name: '',
    legal_entity_type: 'PT',
    email: '',
    npwp: '',
    phone: '',
    kbli_code: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    documents_folder_url: '',
    internal_notes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await companies.create(formData);
      if (response.ok) {
        navigate('/');
      } else {
        setError(response.error || 'Failed to create company');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            New Client
          </h2>
          <p className="text-text-secondary">
            Add a new company to the tax management system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="company_name">Company Name *</label>
                <input
                  id="company_name"
                  name="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                  className="w-full"
                  placeholder="PT Example Indonesia"
                />
              </div>

              <div>
                <label htmlFor="legal_entity_type">Legal Entity Type *</label>
                <select
                  id="legal_entity_type"
                  name="legal_entity_type"
                  value={formData.legal_entity_type}
                  onChange={handleChange}
                  required
                  className="w-full"
                >
                  <option value="PT">PT</option>
                  <option value="PT_PMA">PT PMA</option>
                  <option value="CV">CV</option>
                  <option value="FIRMA">FIRMA</option>
                  <option value="UD">UD</option>
                  <option value="PERORANGAN">Perorangan</option>
                </select>
              </div>

              <div>
                <label htmlFor="kbli_code">KBLI Code</label>
                <input
                  id="kbli_code"
                  name="kbli_code"
                  type="text"
                  value={formData.kbli_code}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="62010"
                  maxLength="5"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full"
                  placeholder="contact@company.com"
                />
              </div>

              <div>
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="+62 361 123456"
                />
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Tax Information</h3>
            <div>
              <label htmlFor="npwp">NPWP</label>
              <input
                id="npwp"
                name="npwp"
                type="text"
                value={formData.npwp}
                onChange={handleChange}
                className="w-full"
                placeholder="01.234.567.8-901.000"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Address</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="address">Street Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full"
                  rows="2"
                  placeholder="Jalan Example No. 123"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full"
                    placeholder="Denpasar"
                  />
                </div>

                <div>
                  <label htmlFor="province">Province</label>
                  <input
                    id="province"
                    name="province"
                    type="text"
                    value={formData.province}
                    onChange={handleChange}
                    className="w-full"
                    placeholder="Bali"
                  />
                </div>

                <div>
                  <label htmlFor="postal_code">Postal Code</label>
                  <input
                    id="postal_code"
                    name="postal_code"
                    type="text"
                    value={formData.postal_code}
                    onChange={handleChange}
                    className="w-full"
                    placeholder="80361"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="documents_folder_url">Documents Folder URL</label>
                <input
                  id="documents_folder_url"
                  name="documents_folder_url"
                  type="url"
                  value={formData.documents_folder_url}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="https://drive.google.com/..."
                />
              </div>

              <div>
                <label htmlFor="internal_notes">Internal Notes</label>
                <textarea
                  id="internal_notes"
                  name="internal_notes"
                  value={formData.internal_notes}
                  onChange={handleChange}
                  className="w-full"
                  rows="3"
                  placeholder="Any internal notes about this client..."
                />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Client'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
