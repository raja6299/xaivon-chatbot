

async function testLead() {
  try {
    console.log("Sending POST to http://localhost:3000/api/leads");
    const response = await fetch('http://localhost:3000/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test User',
        email: 'test@example.com',
        company: 'Test Corp',
        phone: '1234567890',
        sessionId: 'test-session-123'
      })
    });
    
    const text = await response.text();
    console.log("HTTP STATUS:", response.status);
    console.log("RAW RESPONSE:");
    console.log(text);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testLead();
