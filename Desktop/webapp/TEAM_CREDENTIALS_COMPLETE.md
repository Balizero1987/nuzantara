# 🔐 ZANTARA - Team Credentials (Complete)

**Date**: 12 Novembre 2025
**System**: ZANTARA Production (zantara.balizero.com)
**Total Users**: 22 members
**Auth Type**: Email + 6-digit PIN

---

## 🏢 MANAGEMENT (3 users)

### 1. Zainal Abidin (CEO)
```
Email: zainal@balizero.com
PIN:   847261
Role:  CEO
Badge: 👑
```

### 2. Ruslana (Board Member)
```
Email: ruslana@balizero.com
PIN:   293518
Role:  Regina - Ukraine
Badge: 👑
Department: Advisory
```

### 3. Zero (AI Bridge/Tech Lead)
```
Email: zero@balizero.com
PIN:   010719
Role:  CEO / Tech Lead
Badge: 👑
Department: Management
```

---

## ⚡ SETUP TEAM (7 users)

### 4. Amanda (Executive Consultant)
```
Email: amanda@balizero.com
PIN:   614829
Role:  Executive - Setup
Badge: 📒
```

### 5. Anton (Executive Consultant)
```
Email: anton@balizero.com
PIN:   538147
Role:  Executive - Setup
Badge: 🎯
```

### 6. Vino (Junior Consultant)
```
Email: info@balizero.com
PIN:   926734
Role:  Junior - Setup
Badge: 🎨
```

### 7. Krisna (Executive Consultant)
```
Email: krishna@balizero.com
PIN:   471592
Role:  Executive - Setup
Badge: ✅
```

### 8. Adit (Crew Lead)
```
Email: consulting@balizero.com
PIN:   385216
Role:  Supervisor - Setup
Badge: ⚡
```

### 9. Ari (Specialist Consultant)
```
Email: ari.firda@balizero.com
PIN:   759483
Role:  Team Leader - Setup
Badge: 💍
```

### 10. Dea (Executive Consultant)
```
Email: dea@balizero.com
PIN:   162847
Role:  Executive - Setup
Badge: ✨
```

### 11. Surya (Specialist Consultant)
```
Email: surya@balizero.com
PIN:   894621
Role:  Team Leader - Setup
Badge: 📚
```

### 12. Damar (Junior Consultant)
```
Email: damar@balizero.com
PIN:   637519
Role:  Junior - Setup
Badge: 🌱
```

---

## 📊 TAX DEPARTMENT (6 users)

### 13. Veronika (Tax Manager)
```
Email: tax@balizero.com
PIN:   418639
Role:  Tax Manager
Badge: 📊
```

### 14. Olena (External Tax Advisory)
```
Email: olena@balizero.com
PIN:   925814
Role:  Advisory - Tax (🇺🇦)
Badge: 🌐
```

### 15. Angel (Tax Expert)
```
Email: angel.tax@balizero.com
PIN:   341758
Role:  Tax Lead
Badge: 🔎
```

### 16. Kadek (Tax Consultant)
```
Email: kadek.tax@balizero.com
PIN:   786294
Role:  Tax Lead
Badge: 📐
```

### 17. Dewa Ayu (Tax Consultant)
```
Email: dewa.ayu.tax@balizero.com
PIN:   259176
Role:  Tax Lead
Badge: 🗂️
```

### 18. Faisha (Tax Care)
```
Email: faisha.tax@balizero.com
PIN:   673942
Role:  Take Care - Tax
Badge: 🧾
```

---

## 🌸 RECEPTION (1 user)

### 19. Rina (Reception)
```
Email: rina@balizero.com
PIN:   214876
Role:  Reception
Badge: 🌸
```

---

## 🎤 MARKETING (2 users)

### 20. Nina (Marketing Advisory)
```
Email: nina@balizero.com
PIN:   582931
Role:  Supervisor - Marketing
Badge: 🎤
```

### 21. Sahira (Marketing Specialist)
```
Email: sahira@balizero.com
PIN:   512638
Role:  Junior - Marketing
Badge: 🌟
```

---

## 🧐 ADVISORY (1 user)

### 22. Marta (External Advisory)
```
Email: marta@balizero.com
PIN:   847325
Role:  Advisory - Setup (🇺🇦)
Badge: 🧐
```

---

## 📋 Quick Access Table

| # | Name | Email | PIN | Department | Role |
|---|------|-------|-----|------------|------|
| 1 | Zainal | zainal@balizero.com | 847261 | Management | CEO |
| 2 | Ruslana | ruslana@balizero.com | 293518 | Advisory | Regina |
| 3 | Zero | zero@balizero.com | 010719 | Management | Tech Lead |
| 4 | Amanda | amanda@balizero.com | 614829 | Setup | Executive |
| 5 | Anton | anton@balizero.com | 538147 | Setup | Executive |
| 6 | Vino | info@balizero.com | 926734 | Setup | Junior |
| 7 | Krisna | krishna@balizero.com | 471592 | Setup | Executive |
| 8 | Adit | consulting@balizero.com | 385216 | Setup | Supervisor |
| 9 | Ari | ari.firda@balizero.com | 759483 | Setup | Team Leader |
| 10 | Dea | dea@balizero.com | 162847 | Setup | Executive |
| 11 | Surya | surya@balizero.com | 894621 | Setup | Team Leader |
| 12 | Damar | damar@balizero.com | 637519 | Setup | Junior |
| 13 | Veronika | tax@balizero.com | 418639 | Tax | Manager |
| 14 | Olena | olena@balizero.com | 925814 | Tax | Advisory |
| 15 | Angel | angel.tax@balizero.com | 341758 | Tax | Lead |
| 16 | Kadek | kadek.tax@balizero.com | 786294 | Tax | Lead |
| 17 | Dewa Ayu | dewa.ayu.tax@balizero.com | 259176 | Tax | Lead |
| 18 | Faisha | faisha.tax@balizero.com | 673942 | Tax | Care |
| 19 | Rina | rina@balizero.com | 214876 | Reception | Reception |
| 20 | Nina | nina@balizero.com | 582931 | Marketing | Supervisor |
| 21 | Sahira | sahira@balizero.com | 512638 | Marketing | Junior |
| 22 | Marta | marta@balizero.com | 847325 | Advisory | Advisory |

---

## 🔧 System Integration

### Backend Configuration
- **File**: `/apps/webapp/team-config.js` (423 lines)
- **Users**: All 22 members configured
- **Permissions**: Role-based access control
- **Welcome Messages**: Personalized per user
- **Dashboards**: Custom widgets per role

### Frontend Integration
- **Login Page**: `login.html` (supports email + PIN)
- **Auth Endpoint**: `POST /api/auth/demo`
- **Token Storage**: localStorage (`zantara-token`, `zantara-user`)

### Authentication Flow
```
1. User enters email + PIN
2. Frontend validates format
3. POST /api/auth/demo with credentials
4. Backend generates JWT token
5. Frontend stores token in localStorage
6. Redirect to /chat.html
7. Personalized welcome message
```

---

## 📝 How to Use

### For Each Team Member:

1. **Navigate to**: https://zantara.balizero.com
2. **Enter your email**: (see table above)
3. **Enter your PIN**: 6 digits (see table above)
4. **Click**: "SIGN IN"
5. **Access**: Full ZANTARA platform with AI chat

### Features Available to All:
- ✅ AI Chat (Llama 4 Scout + Claude Haiku)
- ✅ RAG Search (30,157 documents)
- ✅ Indonesian Laws (8,923 docs)
- ✅ Visa Information (1,612 docs)
- ✅ Tax Knowledge (895 docs)
- ✅ KBLI Codes (8,887 docs)
- ✅ Session History
- ✅ Real-time Streaming

---

## 🔒 Security Notes

### Current System (Demo Auth)
- PIN-based authentication (6 digits)
- Simple token generation (`demo_{userId}_{timestamp}`)
- localStorage for token storage
- No password hashing (demo only)
- Tokens expire after 1 hour

### Production Recommendations
1. **Upgrade to JWT**: Proper signed tokens with claims
2. **Password Hashing**: bcrypt or Argon2
3. **HttpOnly Cookies**: Move tokens out of localStorage
4. **2FA Optional**: For management users
5. **OAuth Integration**: Google/Microsoft login
6. **Role-Based Access**: Implement permissions properly
7. **Audit Logging**: Track all auth events

---

## 👥 Department Breakdown

| Department | Users | Percentage |
|------------|-------|------------|
| Setup Team | 9 | 41% |
| Tax Department | 6 | 27% |
| Management | 3 | 14% |
| Marketing | 2 | 9% |
| Advisory | 1 | 5% |
| Reception | 1 | 5% |
| **TOTAL** | **22** | **100%** |

---

## ✅ Validation Status

- ✅ All 22 emails configured in `team-config.js`
- ✅ All PINs unique (6 digits)
- ✅ All roles assigned
- ✅ All departments mapped
- ✅ All welcome messages personalized
- ✅ All dashboard widgets configured
- ✅ System tested and operational

---

## 📞 Support

For credential issues or access problems:
- Contact: Zero (zero@balizero.com)
- Tech Support: Available via ZANTARA chat
- System Status: https://nuzantara-rag.fly.dev/health

---

**Document Version**: 1.0
**Last Updated**: 12 Novembre 2025, 01:00 CET
**Status**: ✅ COMPLETE & OPERATIONAL

**End of Credentials Document**
