// 🔧 Google Apps Script - Bali Intel Team Setup
// INSTRUCTIONS:
// 1. Go to https://script.google.com
// 2. New project > Paste this code
// 3. Update FOLDER_ID and collaborator emails
// 4. Save (Ctrl+S)
// 5. Select "setupBaliIntelDrive" from dropdown
// 6. Click ▶️ RUN button
// 7. Authorize (first time only)

// ========== CONFIGURATION ==========
const FOLDER_ID = '1wphV3Xsvw2cGrtRi9kzx8dsrmX_wF6CX'; // SCRAPING folder ID

// Collaborator emails (UPDATE THESE!)
const COLLABORATORI = {
  'Adit': 'adit@balizero.com',
  'Dea': 'dea@balizero.com',
  'Krisna': 'krisna@balizero.com',
  'Surya': 'surya@balizero.com',
  'Sahira': 'sahira@balizero.com',
  'Damar': 'damar@balizero.com',
  'Vino': 'vino@balizero.com'
};

// ========== TEMPLATES ==========
const TEMPLATES = {
  'Immigration_Visas': {
    collaboratore: 'Adit',
    email: COLLABORATORI.Adit,
    template: `🔥 INTEL IMMIGRATION & VISAS - [DATE]
👤 Collaborator: Adit
⏰ Start time:
⏰ End time:

📍 NEWS 1:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 2:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 3:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 4:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 5:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

✅ Status: [Completed/In Progress/Issues]
💬 Daily notes:
🚨 Urgent items to report:
📊 Total news found:`,

    listaSiti: `🛂 IMMIGRATION & VISAS SITES - Adit

⭐ PRIORITY SITES (always check):
1. 🏛️ Imigrasi Indonesia
   🔗 https://www.imigrasi.go.id/id/
   📝 Official Direktorat Jenderal Imigrasi

2. 🏛️ Kemenkumham
   🔗 https://www.kemenkumham.go.id/berita
   📝 Ministry of Law and Human Rights

3. 🏛️ Kedutaan Indonesia
   🔗 https://kemlu.go.id/portal/id
   📝 Ministry of Foreign Affairs

🔍 SECONDARY SITES (if time permits):
4. 📰 Kompas Visa/Immigration
   🔗 https://kompas.com
   📝 Search "visa" or "imigrasi"

5. 📰 Detik Immigration
   🔗 https://detik.com
   📝 Search "imigrasi" or "KITAS"

6. 📱 Indonesia Expat
   🔗 https://indonesiaexpat.id
   📝 Expat community, visa section

7. 📱 Bali Expat Facebook
   🔗 https://facebook.com
   📝 Search groups "Bali Expat", "Indonesia Visa"

🎯 WHAT TO LOOK FOR:
✅ New visa rules (D12, C1, C18, C22, D2, ALL VISAS)
✅ KITAS/KITAP procedure changes
✅ Important deadlines (application deadlines)
✅ New visa types or permits
✅ Overstay penalties/fines
✅ Immigration office closures/openings
✅ Fee/tariff changes
✅ Golden Visa updates

❌ DO NOT INCLUDE:
❌ Old news (older than 3 days)
❌ Spam/service advertisements
❌ Unrelated political gossip
❌ News about other countries`
  },

  'Business_Tax': {
    collaboratore: 'Dea',
    email: COLLABORATORI.Dea,
    template: `🔥 INTEL BUSINESS & TAX - [DATE]
👤 Collaborator: Dea
⏰ Start time:
⏰ End time:

📍 NEWS 1:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 2:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 3:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 4:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 5:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

✅ Status: [Completed/In Progress/Issues]
💬 Daily notes:
🚨 Urgent items to report:
📊 Total news found:`,

    listaSiti: `🏢 BUSINESS & TAX SITES - Dea

⭐ PRIORITY SITES (always check):
1. 🏛️ BKPM
   🔗 https://www.bkpm.go.id/id
   📝 Investment Coordinating Board

2. 🏛️ OSS Indonesia
   🔗 https://oss.go.id
   📝 Online Single Submission

3. 🏛️ Ditjen Pajak
   🔗 https://www.pajak.go.id
   📝 Directorate General of Taxation

🔍 SECONDARY SITES (if time permits):
4. 📰 Bisnis.com
   🔗 https://bisnis.com
   📝 "Tax" and "Business" sections

5. 📰 Kontan Business
   🔗 https://kontan.co.id
   📝 Business and economy news

6. 📱 Kadin Indonesia
   🔗 https://kadin.id
   📝 Chamber of Commerce and Industry

7. 📱 PwC Indonesia Tax
   🔗 https://www.pwc.com/id/en/tax
   📝 Tax alerts and updates

🎯 WHAT TO LOOK FOR:
✅ New PT/PMA rules
✅ Tax rate changes
✅ New KBLI codes
✅ OSS system updates
✅ Tax incentives/holidays
✅ Reporting deadlines (SPT, LKPM)
✅ Capital requirement changes
✅ Foreign ownership rules
✅ BPJS updates

❌ DO NOT INCLUDE:
❌ Old news (older than 3 days)
❌ Business service advertising
❌ Corporate gossip
❌ Stock market news (unless regulatory)`
  },

  'Real_Estate': {
    collaboratore: 'Krisna',
    email: COLLABORATORI.Krisna,
    template: `🔥 INTEL REAL ESTATE - [DATE]
👤 Collaborator: Krisna
⏰ Start time:
⏰ End time:

📍 NEWS 1:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 2:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 3:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 4:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 5:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

✅ Status: [Completed/In Progress/Issues]
💬 Daily notes:
🚨 Urgent items to report:
📊 Total news found:`,

    listaSiti: `🏠 REAL ESTATE SITES - Krisna

⭐ PRIORITY SITES (always check):
1. 🏛️ BPN (Badan Pertanahan Nasional)
   🔗 https://www.bpn.go.id
   📝 Land and property authority

2. 🏛️ Kementerian PUPR
   🔗 https://www.pu.go.id
   📝 Public Works and Housing Ministry

3. 🏛️ BPS Real Estate
   🔗 https://www.bps.go.id
   📝 Statistics office, property data

🔍 SECONDARY SITES (if time permits):
4. 📰 Rumah.com News
   🔗 https://www.rumah.com/berita-properti
   📝 Property news and trends

5. 📰 Lamudi Indonesia
   🔗 https://www.lamudi.co.id/journal
   📝 Property market insights

6. 📱 Property Guru Indonesia
   🔗 https://www.propertyguru.co.id
   📝 Property news

7. 📱 REI (Real Estate Indonesia)
   🔗 https://www.rei.or.id
   📝 Real Estate association

🎯 WHAT TO LOOK FOR:
✅ Hak Pakai rule changes
✅ Building permit (IMB/PBG) updates
✅ Foreign ownership regulations
✅ Property tax changes
✅ Land certificate issues
✅ Zoning regulation updates
✅ Construction permit changes
✅ Environmental clearance rules
✅ Strata title regulations

❌ DO NOT INCLUDE:
❌ Property listings/ads
❌ Market price fluctuations (unless regulatory)
❌ Individual property disputes
❌ Real estate advertising`
  },

  'Events_Culture': {
    collaboratore: 'Surya',
    email: COLLABORATORI.Surya,
    template: `🔥 INTEL EVENTS & CULTURE - [DATE]
👤 Collaborator: Surya
⏰ Start time:
⏰ End time:

📍 NEWS 1:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 2:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 3:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 4:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 5:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

✅ Status: [Completed/In Progress/Issues]
💬 Daily notes:
🚨 Urgent items to report:
📊 Total news found:`,

    listaSiti: `🎭 EVENTS & CULTURE SITES - Surya

⭐ PRIORITY SITES (always check):
1. 🏛️ Kemenparekraf
   🔗 https://kemenparekraf.go.id
   📝 Ministry of Tourism and Creative Economy

2. 🏛️ Bali Provincial Government
   🔗 https://www.baliprov.go.id
   📝 Official Bali government site

3. 🏛️ Ministry of Education and Culture
   🔗 https://kebudayaan.kemdikbud.go.id
   📝 Culture and education ministry

🔍 SECONDARY SITES (if time permits):
4. 📰 Detik Travel
   🔗 https://travel.detik.com
   📝 Travel and tourism news

5. 📰 Kompas Travel
   🔗 https://travel.kompas.com
   📝 Travel section

6. 📱 Bali Post
   🔗 https://www.balipost.com
   📝 Local Bali newspaper

7. 📱 Wonderful Indonesia
   🔗 https://www.indonesia.travel
   📝 Official tourism site

🎯 WHAT TO LOOK FOR:
✅ Festival dates and calendar
✅ Cultural event announcements
✅ Tourism regulation changes
✅ Nyepi preparations/rules
✅ Galungan/Kuningan dates
✅ Temple ceremony schedules
✅ Art exhibition openings
✅ Music festival announcements
✅ Cultural site closures/openings
✅ Traditional ceremony guidelines

❌ DO NOT INCLUDE:
❌ Commercial event promotions
❌ Private party announcements
❌ Restaurant/club events
❌ Non-cultural entertainment`
  },

  'Social_Media': {
    collaboratore: 'Sahira',
    email: COLLABORATORI.Sahira,
    template: `🔥 INTEL SOCIAL MEDIA - [DATE]
👤 Collaborator: Sahira
⏰ Start time:
⏰ End time:

📍 NEWS 1:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 2:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 3:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 4:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 5:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

✅ Status: [Completed/In Progress/Issues]
💬 Daily notes:
🚨 Urgent items to report:
📊 Total news found:`,

    listaSiti: `📱 SOCIAL MEDIA SITES - Sahira

⭐ SOCIAL PLATFORMS (always check):
1. 📸 Instagram Trending
   🔗 https://instagram.com
   📝 Hashtags: #bali #indonesia #viral #trending

2. 🎵 TikTok Indonesia
   🔗 https://tiktok.com
   📝 Trending videos Bali/Indonesia

3. 📘 Facebook Groups
   🔗 https://facebook.com
   📝 Groups: Bali Expat, Indonesia Social

🔍 SECONDARY NEWS SITES (if time permits):
4. 📰 Dailysocial.id
   🔗 https://dailysocial.id
   📝 Social media and tech news Indonesia

5. 📰 Marketing.co.id
   🔗 https://marketing.co.id
   📝 Marketing and social media trends

6. 📱 Social Media Today
   🔗 https://www.socialmediatoday.com
   📝 Global social media news

7. 📱 Tech in Asia Indonesia
   🔗 https://www.techinasia.com/id
   📝 Tech and social media updates

🎯 WHAT TO LOOK FOR:
✅ Viral trends about Bali/Indonesia
✅ Influencer news (local/international)
✅ Social media regulation changes
✅ Platform policy updates (Instagram, TikTok, FB)
✅ Digital marketing trends
✅ Social commerce developments
✅ Creator economy news
✅ Content moderation updates
✅ Privacy policy changes

❌ DO NOT INCLUDE:
❌ Individual influencer drama
❌ Personal social media posts
❌ Commercial brand promotions
❌ Non-social tech news`
  },

  'Competitors': {
    collaboratore: 'Damar',
    email: COLLABORATORI.Damar,
    template: `🔥 INTEL COMPETITORS - [DATE]
👤 Collaborator: Damar
⏰ Start time:
⏰ End time:

📍 NEWS 1:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 2:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 3:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 4:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 5:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

✅ Status: [Completed/In Progress/Issues]
💬 Daily notes:
🚨 Urgent items to report:
📊 Total news found:`,

    listaSiti: `🔍 COMPETITORS SITES - Damar

⭐ DIRECT COMPETITORS (always check):
1. 🏢 Cekindo
   🔗 https://www.cekindo.com/blog
   📝 Blog and news section

2. 🏢 Emerhub
   🔗 https://emerhub.com/indonesia
   📝 Indonesia services page

3. 🏢 Sinta Prima
   🔗 https://sintaprima.com
   📝 News and updates section

🔍 INDUSTRY NEWS (if time permits):
4. 📰 Indonesia Business Law
   🔗 https://www.indonesiabusinesslaw.com
   📝 Legal industry news

5. 📰 SSEK Legal Blog
   🔗 https://blog.ssek.com
   📝 Law firm updates

6. 📱 Legal Era Indonesia
   🔗 https://legaleraindonesia.com
   📝 Legal industry news

7. 📱 Business Law Indonesia
   🔗 https://businesslaw-indonesia.com
   📝 Business law updates

🎯 WHAT TO LOOK FOR:
✅ New services launched
✅ Pricing changes/promotions
✅ Team expansion/new hires
✅ Office openings/relocations
✅ Marketing campaigns
✅ Client testimonials/case studies
✅ Partnership announcements
✅ Technology upgrades
✅ Process improvements
✅ Competitive advantages claimed

❌ DO NOT INCLUDE:
❌ Internal company gossip
❌ Non-strategic HR announcements
❌ Generic industry news
❌ Non-competitive services`
  },

  'General_News': {
    collaboratore: 'Vino',
    email: COLLABORATORI.Vino,
    template: `🔥 INTEL GENERAL NEWS - [DATE]
👤 Collaborator: Vino
⏰ Start time:
⏰ End time:

📍 NEWS 1:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 2:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 3:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 4:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

📍 NEWS 5:
🔗 Link:
📝 Summary:
⭐ Priority: [High/Medium/Low]
🏷️ Tags:

✅ Status: [Completed/In Progress/Issues]
💬 Daily notes:
🚨 Urgent items to report:
📊 Total news found:`,

    listaSiti: `📰 GENERAL NEWS SITES - Vino

⭐ MAJOR NEWS SITES (always check):
1. 📰 Kompas
   🔗 https://kompas.com
   📝 Major Indonesian news site

2. 📰 Detik
   🔗 https://detik.com
   📝 Popular news portal

3. 📰 Tempo
   🔗 https://tempo.co
   📝 News magazine

🔍 ADDITIONAL SOURCES (if time permits):
4. 📺 CNN Indonesia
   🔗 https://cnnindonesia.com
   📝 International news perspective

5. 📰 Antara News
   🔗 https://antaranews.com
   📝 National news agency

6. 📱 Tribun Bali
   🔗 https://bali.tribunnews.com
   📝 Local Bali news

7. 📱 Berita Bali
   🔗 https://beritabali.com
   📝 Local Bali focus

🎯 WHAT TO LOOK FOR:
✅ Politics affecting expats
✅ Economic policy changes
✅ Government regulation updates
✅ International relations news
✅ Currency/economic developments
✅ Infrastructure projects (Bali/Indonesia)
✅ Natural disaster warnings
✅ Health/safety announcements
✅ Transportation updates
✅ General Bali-specific news

❌ DO NOT INCLUDE:
❌ Sports news (unless Olympic/major)
❌ Celebrity entertainment gossip
❌ Weather reports (unless extreme)
❌ Crime news (unless policy-related)`
  }
};

// ========== MAIN FUNCTION ==========
function setupBaliIntelDrive() {
  Logger.log('🚀 Starting Bali Intel Drive setup...');

  try {
    // 1. Get SCRAPING folder
    const scrapingFolder = DriveApp.getFolderById(FOLDER_ID);
    Logger.log('✅ SCRAPING folder found: ' + scrapingFolder.getName());

    // 2. Create all folders and documents
    const folders = Object.keys(TEMPLATES);
    const results = {
      foldersCreated: [],
      docsCreated: [],
      errors: []
    };

    for (let i = 0; i < folders.length; i++) {
      const folderName = folders[i];
      const config = TEMPLATES[folderName];

      try {
        Logger.log(`\n📁 Creating folder: ${folderName}...`);

        // Create folder
        const folder = scrapingFolder.createFolder(folderName);
        results.foldersCreated.push(folderName);
        Logger.log(`✅ Folder created: ${folderName}`);

        // Create TEMPLATE_GIORNALIERO
        const templateDoc = DocumentApp.create('TEMPLATE_GIORNALIERO');
        const templateBody = templateDoc.getBody();
        templateBody.setText(config.template);
        const templateFile = DriveApp.getFileById(templateDoc.getId());
        templateFile.moveTo(folder);
        results.docsCreated.push(`${folderName}/TEMPLATE_GIORNALIERO`);
        Logger.log(`✅ Document created: TEMPLATE_GIORNALIERO`);

        // Create LISTA_SITI
        const listaDoc = DocumentApp.create('LISTA_SITI');
        const listaBody = listaDoc.getBody();
        listaBody.setText(config.listaSiti);
        const listaFile = DriveApp.getFileById(listaDoc.getId());
        listaFile.moveTo(folder);
        results.docsCreated.push(`${folderName}/LISTA_SITI`);
        Logger.log(`✅ Document created: LISTA_SITI`);

        // Set permissions (if email is valid)
        if (config.email && config.email.indexOf('@') > -1 && config.email.indexOf('balizero.com') > -1) {
          try {
            folder.addEditor(config.email);
            Logger.log(`✅ Editor permissions for: ${config.email}`);
          } catch (e) {
            Logger.log(`⚠️ Warning: Cannot add editor ${config.email}: ${e.message}`);
            results.errors.push(`Permissions ${folderName}: ${e.message}`);
          }
        } else {
          Logger.log(`⚠️ Skipping permissions: invalid email for ${config.collaboratore}`);
        }

      } catch (e) {
        Logger.log(`❌ Error with ${folderName}: ${e.message}`);
        results.errors.push(`${folderName}: ${e.message}`);
      }
    }

    // 3. Final report
    Logger.log('\n\n========== FINAL REPORT ==========');
    Logger.log(`✅ Folders created: ${results.foldersCreated.length}/7`);
    Logger.log(`✅ Documents created: ${results.docsCreated.length}/14`);
    if (results.errors.length > 0) {
      Logger.log(`⚠️ Errors: ${results.errors.length}`);
      results.errors.forEach(err => Logger.log(`  - ${err}`));
    }
    Logger.log('\n🎉 SETUP COMPLETED!');
    Logger.log(`📂 Link: https://drive.google.com/drive/folders/${FOLDER_ID}`);

    return results;

  } catch (e) {
    Logger.log(`❌ CRITICAL ERROR: ${e.message}`);
    Logger.log(e.stack);
    throw e;
  }
}

// ========== TEST FUNCTION ==========
function testConnection() {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    Logger.log('✅ Connection OK: ' + folder.getName());
    return true;
  } catch (e) {
    Logger.log('❌ Connection error: ' + e.message);
    return false;
  }
}
