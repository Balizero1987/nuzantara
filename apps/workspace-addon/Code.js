/**
 * Zantara Bridge - Google Workspace Add-on
 * Main entry point for all Workspace apps
 */

const ZANTARA_API = 'https://zantara-bridge-v2-prod-1064094238013.asia-southeast2.run.app';
const BRAND_COLOR = '#667eea';

/**
 * Main homepage for the add-on
 */
function onHomepage(e) {
  const userEmail = Session.getActiveUser().getEmail();
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Zantara Bridge')
        .setSubtitle('Your AI-Powered Workspace Assistant')
        .setImageUrl('https://raw.githubusercontent.com/Balizero1987/zantara-bridge/main/assets/zantara-logo.png')
        .setImageStyle(CardService.ImageStyle.CIRCLE)
    );

  // Welcome section
  const welcomeSection = CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph()
        .setText(`Welcome, <b>${userEmail}</b>!<br><br>Zantara Bridge connects all your Google Workspace apps with AI-powered automation.`)
    )
    .addWidget(
      CardService.newImage()
        .setImageUrl('https://raw.githubusercontent.com/Balizero1987/zantara-bridge/main/assets/dashboard.png')
        .setAltText('Zantara Dashboard')
    );

  // Quick Actions section
  const quickActionsSection = CardService.newCardSection()
    .setHeader('⚡ Quick Actions')
    .addWidget(
      CardService.newButtonSet()
        .addButton(
          CardService.newTextButton()
            .setText('📊 Create Sheet')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('createNewSheet')
            )
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
            .setBackgroundColor(BRAND_COLOR)
        )
        .addButton(
          CardService.newTextButton()
            .setText('📧 Compose Email')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('composeEmail')
            )
        )
    )
    .addWidget(
      CardService.newButtonSet()
        .addButton(
          CardService.newTextButton()
            .setText('📅 Schedule Event')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('scheduleEvent')
            )
        )
        .addButton(
          CardService.newTextButton()
            .setText('📁 Browse Drive')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('browseDrive')
            )
        )
    );

  // Services Status section
  const servicesSection = CardService.newCardSection()
    .setHeader('🔗 Connected Services')
    .addWidget(createServiceStatusWidget('Gmail', true))
    .addWidget(createServiceStatusWidget('Drive', true))
    .addWidget(createServiceStatusWidget('Calendar', true))
    .addWidget(createServiceStatusWidget('Sheets', true))
    .addWidget(createServiceStatusWidget('Docs', true));

  // Memory section
  const memorySection = CardService.newCardSection()
    .setHeader('💾 Memory & Context')
    .addWidget(
      CardService.newTextInput()
        .setFieldName('userId')
        .setTitle('User ID')
        .setValue(userEmail.split('@')[0])
    )
    .addWidget(
      CardService.newTextInput()
        .setFieldName('memory_fact')
        .setTitle('Add a fact')
        .setHint('E.g., "Prefers morning meetings"')
    )
    .addWidget(
      CardService.newTextButton()
        .setText('Save to Memory')
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('saveMemory')
            .setParameters({userId: userEmail})
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    );

  // Dashboard link
  const dashboardSection = CardService.newCardSection()
    .addWidget(
      CardService.newTextButton()
        .setText('🚀 Open Full Dashboard')
        .setOpenLink(
          CardService.newOpenLink()
            .setUrl(ZANTARA_API + '/dashboard')
            .setOpenAs(CardService.OpenAs.FULL_SIZE)
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#764ba2')
    );

  card.addSection(welcomeSection)
    .addSection(quickActionsSection)
    .addSection(servicesSection)
    .addSection(memorySection)
    .addSection(dashboardSection);

  return card.build();
}

/**
 * Gmail specific homepage
 */
function onGmailMessage(e) {
  const accessToken = e.gmail.accessToken;
  const messageId = e.gmail.messageId;
  
  const message = Gmail.Users.Messages.get('me', messageId);
  const subject = message.payload.headers.find(h => h.name === 'Subject')?.value || 'No Subject';
  const from = message.payload.headers.find(h => h.name === 'From')?.value || 'Unknown';
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Zantara AI Analysis')
        .setSubtitle('Email Intelligence')
    );

  const analysisSection = CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph()
        .setText(`<b>Subject:</b> ${subject}<br><b>From:</b> ${from}`)
    )
    .addWidget(
      CardService.newButtonSet()
        .addButton(
          CardService.newTextButton()
            .setText('📝 Summarize')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('summarizeEmail')
                .setParameters({messageId: messageId})
            )
        )
        .addButton(
          CardService.newTextButton()
            .setText('💬 Generate Reply')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('generateReply')
                .setParameters({messageId: messageId})
            )
        )
    )
    .addWidget(
      CardService.newTextButton()
        .setText('📊 Export to Sheet')
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('exportEmailToSheet')
            .setParameters({messageId: messageId})
        )
    );

  card.addSection(analysisSection);
  return card.build();
}

/**
 * Drive homepage
 */
function onDriveHomepage(e) {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Zantara Drive Assistant')
        .setSubtitle('Smart File Management')
    );

  const actionsSection = CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph()
        .setText('Organize and analyze your Drive files with AI')
    )
    .addWidget(
      CardService.newButtonSet()
        .addButton(
          CardService.newTextButton()
            .setText('📂 Smart Organize')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('smartOrganize')
            )
        )
        .addButton(
          CardService.newTextButton()
            .setText('🔍 Find Duplicates')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('findDuplicates')
            )
        )
    )
    .addWidget(
      CardService.newTextButton()
        .setText('📈 Storage Analysis')
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('analyzeStorage')
        )
    );

  card.addSection(actionsSection);
  return card.build();
}

/**
 * Calendar homepage
 */
function onCalendarHomepage(e) {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Zantara Calendar AI')
        .setSubtitle('Smart Scheduling')
    );

  const schedulingSection = CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph()
        .setText('AI-powered meeting scheduler and calendar optimizer')
    )
    .addWidget(
      CardService.newButtonSet()
        .addButton(
          CardService.newTextButton()
            .setText('🤖 Find Best Time')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('findBestMeetingTime')
            )
        )
        .addButton(
          CardService.newTextButton()
            .setText('📋 Daily Summary')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('getDailySummary')
            )
        )
    )
    .addWidget(
      CardService.newTextButton()
        .setText('🎯 Optimize Schedule')
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('optimizeSchedule')
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    );

  card.addSection(schedulingSection);
  return card.build();
}

/**
 * Sheets homepage
 */
function onSheetsHomepage(e) {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Zantara Sheets AI')
        .setSubtitle('Data Intelligence')
    );

  const dataSection = CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph()
        .setText('Analyze and visualize your spreadsheet data with AI')
    )
    .addWidget(
      CardService.newButtonSet()
        .addButton(
          CardService.newTextButton()
            .setText('📊 Auto Chart')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('autoCreateChart')
            )
        )
        .addButton(
          CardService.newTextButton()
            .setText('🔮 Predict Trends')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('predictTrends')
            )
        )
    )
    .addWidget(
      CardService.newTextButton()
        .setText('🧹 Clean Data')
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('cleanData')
        )
    );

  card.addSection(dataSection);
  return card.build();
}

/**
 * Helper function to create service status widget
 */
function createServiceStatusWidget(serviceName, isActive) {
  const statusIcon = isActive ? '🟢' : '🔴';
  const statusText = isActive ? 'Connected' : 'Disconnected';
  
  return CardService.newDecoratedText()
    .setText(`<b>${serviceName}</b>`)
    .setBottomLabel(statusText)
    .setStartIcon(
      CardService.newIconImage()
        .setIcon(CardService.Icon.NONE)
        .setIconUrl(`https://raw.githubusercontent.com/Balizero1987/zantara-bridge/main/assets/icons/${serviceName.toLowerCase()}.png`)
    )
    .setEndIcon(
      CardService.newIconImage()
        .setIconUrl(`https://raw.githubusercontent.com/Balizero1987/zantara-bridge/main/assets/icons/${isActive ? 'check' : 'x'}.png`)
    );
}

/**
 * Action functions
 */
function createNewSheet(e) {
  const response = UrlFetchApp.fetch(`${ZANTARA_API}/api/sheets/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      title: 'New Spreadsheet ' + new Date().toISOString(),
      headers: ['Date', 'Description', 'Value']
    })
  });
  
  return CardService.newActionResponseBuilder()
    .setNotification(
      CardService.newNotification()
        .setText('✅ Spreadsheet created successfully!')
    )
    .build();
}

function saveMemory(e) {
  const userId = e.formInput.userId;
  const fact = e.formInput.memory_fact;
  
  const response = UrlFetchApp.fetch(`${ZANTARA_API}/memory/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      userId: userId,
      profile_facts: fact ? [fact] : [],
      summary: ''
    })
  });
  
  return CardService.newActionResponseBuilder()
    .setNotification(
      CardService.newNotification()
        .setText('💾 Memory saved successfully!')
    )
    .build();
}

function showQuickActions(e) {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Quick Actions')
    );

  const actionsSection = CardService.newCardSection()
    .addWidget(
      CardService.newButtonSet()
        .addButton(
          CardService.newTextButton()
            .setText('📧 Email')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('composeEmail')
            )
        )
        .addButton(
          CardService.newTextButton()
            .setText('📊 Sheet')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('createNewSheet')
            )
        )
    );

  card.addSection(actionsSection);
  
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(card.build()))
    .build();
}

// Placeholder functions for other actions
function composeEmail(e) {
  return showNotification('Opening email composer...');
}

function scheduleEvent(e) {
  return showNotification('Opening event scheduler...');
}

function browseDrive(e) {
  return showNotification('Opening Drive browser...');
}

function summarizeEmail(e) {
  return showNotification('Summarizing email...');
}

function generateReply(e) {
  return showNotification('Generating reply...');
}

function exportEmailToSheet(e) {
  return showNotification('Exporting to sheet...');
}

function smartOrganize(e) {
  return showNotification('Organizing files...');
}

function findDuplicates(e) {
  return showNotification('Finding duplicates...');
}

function analyzeStorage(e) {
  return showNotification('Analyzing storage...');
}

function findBestMeetingTime(e) {
  return showNotification('Finding best time...');
}

function getDailySummary(e) {
  return showNotification('Getting daily summary...');
}

function optimizeSchedule(e) {
  return showNotification('Optimizing schedule...');
}

function autoCreateChart(e) {
  return showNotification('Creating chart...');
}

function predictTrends(e) {
  return showNotification('Predicting trends...');
}

function cleanData(e) {
  return showNotification('Cleaning data...');
}

function showNotification(text) {
  return CardService.newActionResponseBuilder()
    .setNotification(
      CardService.newNotification()
        .setText(text)
    )
    .build();
}