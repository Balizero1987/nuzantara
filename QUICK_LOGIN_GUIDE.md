# 🔐 Quick Login Guide

## 🚀 Test Login NOW

### URL
```
https://zantara.balizero.com/index.html
```

---

## 👤 Test Accounts

### 1. CEO Account (Full Access)
```
Email: zainal@balizero.com
PIN: 521209
```
**Permissions:** ALL (admin, finance, hr, tech, marketing)  
**Language:** Indonesian 🇮🇩

### 2. Tech Lead Account (Tech Access)
```
Email: zero@balizero.com
PIN: 010719
```
**Permissions:** tech, admin, finance  
**Language:** Italian 🇮🇹

### 3. Board Member (Full Access)
```
Email: ruslana@balizero.com
PIN: 544835
```
**Permissions:** ALL  
**Language:** English 🇬🇧

### 4. Consultant (Setup Access)
```
Email: amanda@balizero.com
PIN: 180785
```
**Department:** Setup  
**Language:** Indonesian 🇮🇩

### 5. Consultant (Setup Access)
```
Email: anton@balizero.com
PIN: 717657
```
**Department:** Setup  
**Language:** Indonesian 🇮🇩

---

## ✅ What Works

1. **Login** ✅
   - Enter email + 6-digit PIN
   - Get JWT token (24h expiry)
   - Redirect to chat

2. **Security** ✅
   - Rate limiting (3 attempts max)
   - bcrypt PIN hashing
   - JWT authentication

3. **Multilingual** ✅
   - Welcome messages in user's language
   - Indonesian/Italian/English support

4. **Error Handling** ✅
   - Invalid PIN → "Invalid PIN. X attempts remaining"
   - Wrong email → "Invalid credentials"
   - Too many attempts → 5-minute block

---

## 🧪 Test in Console

After login, check:
```javascript
// Token
localStorage.getItem('zantara-auth-token')

// User data
JSON.parse(localStorage.getItem('zantara-user'))

// Permissions
JSON.parse(localStorage.getItem('zantara-permissions'))
```

---

## 📊 Status

**Login System:** ✅ 100% FUNCTIONAL

All features tested and working:
- Authentication ✅
- Authorization ✅
- Rate limiting ✅
- Security ✅
- Multilingual ✅

**Ready to use!** 🎉
