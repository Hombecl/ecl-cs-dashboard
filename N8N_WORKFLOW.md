# n8n Email to Airtable Workflow

## 目標
自動將客戶電郵轉換成 CS cases 並存入 Airtable

## 架構圖

```
Gmail/IMAP Trigger
    ↓
Extract Email Data (Subject, Body, From, Date)
    ↓
AI Analysis (Claude/GPT) - 分析內容
    ├─ Issue Category (Cancel Request, Shipping Delay, etc.)
    ├─ Sentiment (Polite, Frustrated, etc.)
    ├─ Urgency (High, Medium, Low)
    └─ Extract Order Number
    ↓
Search Airtable Orders Table
    ├─ Match Order Number
    └─ Get Order Details
    ↓
Create Case in Airtable
    ↓
Optional: Send Auto-Reply Email
```

## n8n Workflow 步驟

### 1. Email Trigger Node
**Node Type:** `Gmail Trigger` 或 `IMAP Email Trigger`

**Settings:**
- Label/Folder: `Support` 或 `Inbox`
- Poll Interval: 1 minute
- Download Attachments: Yes (如果需要)

**Output:**
```json
{
  "from": "customer@email.com",
  "subject": "Order #12345 - Cancel Request",
  "body": "I would like to cancel my order...",
  "date": "2026-01-16T10:30:00Z",
  "messageId": "abc123..."
}
```

---

### 2. Extract Email Data Node
**Node Type:** `Set` (設置變數)

**Mappings:**
```javascript
{
  "customerEmail": "{{$json.from}}",
  "emailSubject": "{{$json.subject}}",
  "emailBody": "{{$json.body}}",
  "receivedTime": "{{$json.date}}",
  "messageId": "{{$json.messageId}}"
}
```

---

### 3. AI Analysis Node
**Node Type:** `HTTP Request` (Call Anthropic API)

**Settings:**
- Method: POST
- URL: `https://api.anthropic.com/v1/messages`
- Headers:
  - `x-api-key`: Your Anthropic API Key
  - `anthropic-version`: `2023-06-01`
  - `content-type`: `application/json`

**Body:**
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "messages": [{
    "role": "user",
    "content": "Analyze this customer support email and extract:\n1. Issue Category (Cancel Request, Shipping Delay, Not Received, Damaged Item, Wrong Item, Return Request, Tracking Question, Complaint, General Question)\n2. Sentiment (Polite, Concerned, Frustrated, Angry)\n3. Urgency (Low, Medium, High)\n4. Order Number (if mentioned)\n5. Customer Name (if mentioned)\n\nEmail:\nFrom: {{$json.customerEmail}}\nSubject: {{$json.emailSubject}}\nBody: {{$json.emailBody}}\n\nRespond in JSON format only."
  }]
}
```

**Expected Output:**
```json
{
  "issueCategory": "Cancel Request",
  "sentiment": "Polite",
  "urgency": "Medium",
  "orderNumber": "12345",
  "customerName": "John Doe"
}
```

---

### 4. Parse AI Response Node
**Node Type:** `Code` (JavaScript)

**Code:**
```javascript
const aiResponse = $input.item.json.content[0].text;
const parsed = JSON.parse(aiResponse);

return {
  json: {
    issueCategory: parsed.issueCategory,
    sentiment: parsed.sentiment,
    urgency: parsed.urgency,
    platformOrderNumber: parsed.orderNumber,
    customerName: parsed.customerName
  }
};
```

---

### 5. Search Airtable for Order Node
**Node Type:** `Airtable` (Search Records)

**Settings:**
- Operation: Search Records
- Base: Your Airtable Base ID
- Table: `Orders`
- Filter Formula: `{Platform Order Number} = '{{$json.platformOrderNumber}}'`

**Output:** Order details (SKU, item name, amount, etc.)

---

### 6. Create Case in Airtable Node
**Node Type:** `Airtable` (Create Record)

**Settings:**
- Operation: Create
- Base: Your Airtable Base ID
- Table: `CS Cases`

**Fields:**
```json
{
  "Platform Order Number": "{{$node['Parse AI Response'].json.platformOrderNumber}}",
  "Customer Email": "{{$node['Extract Email Data'].json.customerEmail}}",
  "Customer Name": "{{$node['Parse AI Response'].json.customerName}}",
  "Original Message": "{{$node['Extract Email Data'].json.emailBody}}",
  "Email Subject": "{{$node['Extract Email Data'].json.emailSubject}}",
  "Issue Category": "{{$node['Parse AI Response'].json.issueCategory}}",
  "Sentiment": "{{$node['Parse AI Response'].json.sentiment}}",
  "Urgency": "{{$node['Parse AI Response'].json.urgency}}",
  "Status": "New",
  "Created Time": "{{$node['Extract Email Data'].json.receivedTime}}",
  "Source": "Email",
  "Message ID": "{{$node['Extract Email Data'].json.messageId}}",
  "Order": ["{{$node['Search Airtable for Order'].json.id}}"]
}
```

---

### 7. (Optional) Send Auto-Reply Node
**Node Type:** `Gmail` (Send Email)

**Settings:**
- To: `{{$node['Extract Email Data'].json.customerEmail}}`
- Subject: `Re: {{$node['Extract Email Data'].json.emailSubject}}`
- Body:
```
Hi {{$node['Parse AI Response'].json.customerName}},

Thank you for contacting us. We have received your inquiry and our team will respond within 24 hours.

Case Reference: {{$node['Create Case in Airtable'].json.id}}

Best regards,
Customer Support Team
```

---

## 設置步驟

### 1. 安裝 n8n

**選項 A: Docker (推薦)**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**選項 B: npm**
```bash
npm install -g n8n
n8n start
```

打開瀏覽器：http://localhost:5678

### 2. 設置 Credentials

在 n8n 入面設置：
1. **Gmail Credentials** (或 IMAP)
2. **Airtable Credentials**
   - API Key: 你嘅 Airtable Personal Access Token
   - Base ID: `appRCQASsApV4C33N`
3. **Anthropic API Credentials**
   - API Key: 你嘅 Anthropic API key

### 3. Import Workflow

我可以幫你生成一個完整嘅 n8n workflow JSON 檔案，你可以直接 import。

### 4. 測試

1. 發送一封測試電郵
2. 檢查 n8n execution log
3. 確認 case 出現喺 Airtable
4. 檢查 dashboard 能夠顯示新 case

---

## 進階功能

### 1. 去重 (Duplicate Detection)
避免同一封電郵創建多個 cases：
```javascript
// 檢查 Message ID 是否已存在
const existingCase = await airtable.search({
  filterByFormula: `{Message ID} = '${messageId}'`
});

if (existingCase.length > 0) {
  // Skip - already processed
  return;
}
```

### 2. 自動分配 (Auto-Assignment)
根據 issue category 自動分配俾唔同 team member

### 3. Priority Escalation
如果 urgency = High，自動發送 Slack/Email 通知

### 4. Email Threading
將相同 order 嘅電郵 thread 連結埋一齊

---

## 替代方案

### 如果唔想用 n8n:

**方案 A: Airtable Automation + Script**
- 用 Airtable 嘅 automation feature
- 配合 JavaScript script
- 限制：較少靈活性

**方案 B: 自己 build API endpoint**
- 創建一個 `/api/ingest-email` endpoint
- 用 Gmail/Outlook webhook 觸發
- 需要多啲 coding

**方案 C: Zapier**
- 最簡單但需要付費
- 類似 n8n 但冇咁靈活

---

## 成本估算

- **n8n Self-hosted**: 免費（只需 server 費用）
- **n8n Cloud**: $20/month
- **Anthropic API**: ~$0.003 per email (Claude Haiku)
- **Total**: 如果每日處理 100 封電郵 = ~$9/month

---

## 下一步

1. 你想我幫你生成 n8n workflow JSON 檔案嗎？
2. 定係你想用其他方案？
3. 你嘅電郵系統係咩？(Gmail, Outlook, IMAP?)
