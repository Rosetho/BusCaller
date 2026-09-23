// ============================================
// BACKEND - Data Management
// ============================================

function doGet(e) {
  const page = e.parameter.page || 'display';
  
  if (page === 'display') {
    return HtmlService.createHtmlOutputFromFile('Display')
      .setTitle('Bus Display')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else if (page === 'admin') {
    return HtmlService.createHtmlOutputFromFile('Admin')
      .setTitle('Bus Admin')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

function getBusData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  const data = sheet.getRange('A2:C10').getValues(); // Adjust range as needed
  
  const result = [];
  
  for (let i = 0; i < data.length; i++) {
    const status = data[i][0];
    const buses = data[i][1];
    const timestamp = data[i][2];
    
    if (status && buses) {
      // Parse bus numbers (handle comma-separated)
      const busArray = String(buses)
        .split(',')
        .map(b => b.trim())
        .filter(b => b !== '');
      
      result.push({
        status: status,
        buses: busArray,
        timestamp: timestamp ? new Date(timestamp).toLocaleTimeString() : ''
      });
    }
  }
  
  return result;
}

function updateBusData(groups) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  const now = new Date();
  
  // Update each group
  for (let i = 0; i < groups.length; i++) {
    const row = i + 2; // Start at row 2
    const busString = groups[i].buses.join(', ');
    
    sheet.getRange(row, 2).setValue(busString); // Column B: Bus Numbers
    
    // Only timestamp the "NOW BOARDING" row
    if (i === 0) {
      sheet.getRange(row, 3).setValue(now); // Column C: Timestamp
    }
  }
  
  return { success: true, timestamp: now.toLocaleTimeString() };
}

function advanceQueue() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  const data = sheet.getRange('B2:B10').getValues(); // Get all bus number cells
  
  // Shift everything up
  for (let i = 0; i < data.length - 1; i++) {
    sheet.getRange(i + 2, 2).setValue(data[i + 1][0]); // Move next row up
  }
  
  // Clear the last row
  sheet.getRange(data.length + 1, 2).setValue('');
  
  // Timestamp the new "NOW BOARDING"
  sheet.getRange(2, 3).setValue(new Date());
  
  return { success: true };
}

function clearAllBuses() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  sheet.getRange('B2:C10').clearContent();
  return { success: true };
}
