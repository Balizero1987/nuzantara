import { useNavigate } from 'react-router-dom';
import Badge from './Badge';
import Button from './Button';

export default function ClientCard({ company }) {
  const navigate = useNavigate();

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            {company.company_name}
          </h3>
          <div className="text-sm text-text-secondary space-x-2">
            {company.npwp && <span>NPWP: {company.npwp}</span>}
            {company.kbli_code && <span>• KBLI: {company.kbli_code}</span>}
          </div>
        </div>
        <Badge status={company.status}>{company.status}</Badge>
      </div>

      <div className="text-sm text-text-secondary mb-4">
        {company.email && <div>📧 {company.email}</div>}
        {company.phone && <div>📱 {company.phone}</div>}
      </div>

      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={() => navigate(`/companies/${company.id}`)}
        >
          View Profile
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate(`/companies/${company.id}`)}
        >
          Calculate Tax
        </Button>
      </div>
    </div>
  );
}
