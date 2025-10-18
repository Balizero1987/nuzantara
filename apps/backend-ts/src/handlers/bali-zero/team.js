import logger from '../../services/logger.js';
// Complete Bali Zero team data
const BALI_ZERO_TEAM = {
    members: [
        // C-Level
        { id: 'zainal', name: 'Zainal Abidin', role: 'CEO', email: 'zainal@balizero.com', department: 'management', badge: '👑', language: 'Indonesian' },
        { id: 'ruslana', name: 'Ruslana', role: 'Board Member', email: 'ruslana@balizero.com', department: 'management', badge: '💎', language: 'Ukrainian' },
        // Setup Team
        { id: 'amanda', name: 'Amanda', role: 'Lead Executive', email: 'amanda@balizero.com', department: 'setup', badge: '📒', language: 'Indonesian' },
        { id: 'anton', name: 'Anton', role: 'Lead Executive', email: 'anton@balizero.com', department: 'setup', badge: '🎯', language: 'Indonesian' },
        { id: 'krisna', name: 'Krisna', role: 'Lead Executive', email: 'krisna@balizero.com', department: 'setup', badge: '✅', language: 'Indonesian' },
        { id: 'dea', name: 'Dea', role: 'Lead Executive', email: 'dea@balizero.com', department: 'setup', badge: '✨', language: 'Indonesian' },
        { id: 'adit', name: 'Adit', role: 'Crew Lead', email: 'consulting@balizero.com', department: 'setup', badge: '⚡', language: 'Indonesian' },
        { id: 'vino', name: 'Vino', role: 'Lead Junior', email: 'vino@balizero.com', department: 'setup', badge: '🎨', language: 'Indonesian' },
        { id: 'ari', name: 'Ari', role: 'Lead Specialist', email: 'ari.firda@balizero.com', department: 'setup', badge: '💍', language: 'Indonesian' },
        { id: 'surya', name: 'Surya', role: 'Lead Specialist', email: 'surya@balizero.com', department: 'setup', badge: '📚', language: 'Indonesian' },
        { id: 'damar', name: 'Damar', role: 'Junior Consultant', email: 'damar@balizero.com', department: 'setup', badge: '⭐', language: 'Indonesian' },
        // Tax Department
        { id: 'veronika', name: 'Veronika', role: 'Tax Manager', email: 'veronika@balizero.com', department: 'tax', badge: '📊', language: 'Indonesian' },
        { id: 'angel', name: 'Angel', role: 'Tax Expert', email: 'angel@balizero.com', department: 'tax', badge: '🔎', language: 'Indonesian' },
        { id: 'kadek', name: 'Kadek', role: 'Tax Consultant', email: 'kadek@balizero.com', department: 'tax', badge: '📐', language: 'Indonesian' },
        { id: 'dewaayu', name: 'Dewa Ayu', role: 'Tax Consultant', email: 'dewaayu@balizero.com', department: 'tax', badge: '🗂️', language: 'Indonesian' },
        { id: 'faisha', name: 'Faisha', role: 'Tax Care', email: 'faisha@balizero.com', department: 'tax', badge: '🧾', language: 'Indonesian' },
        // Marketing
        { id: 'sahira', name: 'Sahira', role: 'Marketing Specialist', email: 'sahira@balizero.com', department: 'marketing', badge: '🌟', language: 'Indonesian' },
        { id: 'nina', name: 'Nina', role: 'Marketing Advisory', email: 'nina@balizero.com', department: 'marketing', badge: '🎤', language: 'Indonesian' },
        // Reception
        { id: 'rina', name: 'Rina', role: 'Reception', email: 'rina@balizero.com', department: 'reception', badge: '🌸', language: 'Indonesian' },
        // External Advisory
        { id: 'marta', name: 'Marta', role: 'External Advisory', email: 'marta@balizero.com', department: 'advisory', badge: '🧐', language: 'Ukrainian' },
        { id: 'olena', name: 'Olena', role: 'External Advisory', email: 'olena@balizero.com', department: 'advisory', badge: '🌐', language: 'Ukrainian' },
        // Bridge & Tech
        { id: 'zero', name: 'Zero', role: 'Bridge/Tech', email: 'zero@balizero.com', department: 'technology', badge: '🚀', language: 'Italian' }
    ],
    departments: {
        management: { name: 'Management & Leadership', color: '#6366f1', icon: '👑' },
        setup: { name: 'Setup & Operations', color: '#10b981', icon: '⚡' },
        tax: { name: 'Tax Department', color: '#f59e0b', icon: '📊' },
        marketing: { name: 'Marketing & Communications', color: '#ef4444', icon: '🎤' },
        reception: { name: 'Reception & Client Relations', color: '#06b6d4', icon: '🌸' },
        advisory: { name: 'External Advisory', color: '#8b5cf6', icon: '🧐' },
        technology: { name: 'Bridge & Technology', color: '#ec4899', icon: '🚀' }
    },
    stats: {
        total: 23,
        byDepartment: {
            management: 2,
            setup: 10,
            tax: 5,
            marketing: 2,
            reception: 1,
            advisory: 2,
            technology: 1
        },
        byLanguage: {
            Indonesian: 19,
            Ukrainian: 3,
            Italian: 1
        }
    }
};
/**
 * Get complete team list
 */
export async function teamList(req, res) {
    try {
        const { department, role, search } = req.body.params || {};
        let members = [...BALI_ZERO_TEAM.members];
        // Filter by department
        if (department) {
            members = members.filter(m => m.department === department);
        }
        // Filter by role
        if (role) {
            members = members.filter(m => m.role.toLowerCase().includes(role.toLowerCase()));
        }
        // Search by name or email
        if (search) {
            const searchLower = search.toLowerCase();
            members = members.filter(m => m.name.toLowerCase().includes(searchLower) ||
                m.email.toLowerCase().includes(searchLower));
        }
        return res.json({
            ok: true,
            data: {
                members,
                departments: BALI_ZERO_TEAM.departments,
                stats: BALI_ZERO_TEAM.stats,
                count: members.length,
                total: BALI_ZERO_TEAM.stats.total,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger.error('team.list error:', error);
        return res.status(500).json({
            ok: false,
            error: error.message || 'Failed to retrieve team list'
        });
    }
}
/**
 * Get specific team member
 */
export async function teamGet(req, res) {
    try {
        const { id, email } = req.body.params || {};
        let member;
        if (id) {
            member = BALI_ZERO_TEAM.members.find(m => m.id === id);
        }
        else if (email) {
            member = BALI_ZERO_TEAM.members.find(m => m.email.toLowerCase() === email.toLowerCase());
        }
        else {
            return res.status(400).json({
                ok: false,
                error: 'Either id or email parameter is required'
            });
        }
        if (!member) {
            return res.status(404).json({
                ok: false,
                error: 'Team member not found'
            });
        }
        return res.json({
            ok: true,
            data: {
                member,
                department: BALI_ZERO_TEAM.departments[member.department],
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger.error('team.get error:', error);
        return res.status(500).json({
            ok: false,
            error: error.message || 'Failed to retrieve team member'
        });
    }
}
/**
 * Get department info
 */
export async function teamDepartments(req, res) {
    try {
        const { name } = req.body.params || {};
        if (name) {
            const department = BALI_ZERO_TEAM.departments[name];
            if (!department) {
                return res.status(404).json({
                    ok: false,
                    error: 'Department not found'
                });
            }
            const members = BALI_ZERO_TEAM.members.filter(m => m.department === name);
            return res.json({
                ok: true,
                data: {
                    department: {
                        ...department,
                        id: name
                    },
                    members,
                    count: members.length,
                    timestamp: new Date().toISOString()
                }
            });
        }
        // Return all departments
        return res.json({
            ok: true,
            data: {
                departments: BALI_ZERO_TEAM.departments,
                stats: BALI_ZERO_TEAM.stats.byDepartment,
                total: Object.keys(BALI_ZERO_TEAM.departments).length,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger.error('team.departments error:', error);
        return res.status(500).json({
            ok: false,
            error: error.message || 'Failed to retrieve departments'
        });
    }
}
