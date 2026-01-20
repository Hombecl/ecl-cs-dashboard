# n8n Store Detection Configuration

## Workflow ID
`iroQJPDi5SuQCN3o` - CS Email to Airtable - Auto Case Creation

## 目前配置的 Store Mapping

喺 "Detect Store from Forward" node 入面，我哋設置咗以下 store mapping：

```javascript
const storeMapping = {
  'store1-cs@walmart.com': 'WM-STORE1',
  'store2-cs@walmart.com': 'WM-STORE2',
  'store3-cs@walmart.com': 'WM-STORE3',
  'ecl-cs@walmart.com': 'WM-ECL',
  'thekatwalkreadingltd1@gmail.com': 'WM-KATWALK'
};
```

## 點樣運作

### 方法 1: 從 Forward Email Body 檢測
當客服電郵 forward 過去 consolidated email 嘅時候，email body 通常會有類似：
```
---------- Forwarded message ---------
From: customer@example.com
Date: Wed, Jan 16, 2025 at 10:30 AM
Subject: Order Issue
To: store1-cs@walmart.com
```

系統會 parse "To:" 呢一行，然後 match 返去 store mapping。

### 方法 2: 從 Subject 檢測
如果你哋嘅 email forwarding 會加上 store prefix，例如：
- Subject: `[WM-STORE1] Order #12345 - Cancel Request`

系統會自動抽取 `[WM-STORE1]` 作為 store code。

### 方法 3: 從 Email Headers 檢測
如果有 `X-Forwarded-To` header，系統都會用嚟檢測。

## 更新 Store Mapping

去 n8n workflow 入面：
1. 打開 workflow `CS Email to Airtable - Auto Case Creation`
2. 搵到 "Detect Store from Forward" code node
3. 更新 `storeMapping` object
4. Save workflow

## 完整 Workflow 流程

```
Gmail Trigger (每分鐘 poll)
    ↓
Extract Email Data (from, subject, body, date, messageId)
    ↓
Detect Store from Forward (新增！偵測 store code)
    ↓
Check for Duplicate (用 Message ID 檢查)
    ↓
If Not Duplicate (如果係新 email)
    ↓
AI Analysis with Claude (分析內容)
    ↓
Parse AI Response (抽取 JSON + store code)
    ↓
Search for Order (搵 order record)
    ↓
Create CS Case (加埋 Store Code field！)
```

## 測試

1. 發送一封測試電郵去 consolidated inbox
2. 確保 email body 有 "To: xxx-cs@walmart.com" 嘅 line
3. 檢查 n8n execution log
4. 確認新 case 入面嘅 Store Code field 正確

## 需要設置嘅 Credentials

✅ Gmail OAuth2 - 已設置 (thekatwalkreadingltd1@gmail.com)
✅ Airtable Personal Access Token - 已設置
✅ Anthropic API - 已設置

## Workflow 狀態

- Status: **Inactive** (需要手動 activate)
- Nodes: 9 個
- Base ID: `appRCQASsApV4C33N`
- Tables: `CS Cases`, `Orders`

## 下一步

1. **更新 Store Mapping**：將上面嘅範例 email 改成你實際嘅 Walmart store CS emails
2. **Activate Workflow**：去 n8n 撳 "Active" button
3. **測試**：發送測試電郵
4. **監控**：睇 execution logs 確保運作正常

## 如果 Store Detection 失敗

如果系統偵測唔到 store，會設置：
- `storeCode`: "UNKNOWN"
- `detectionMethod`: "manual-review-needed"

你可以之後喺 CS Dashboard 手動更新。
