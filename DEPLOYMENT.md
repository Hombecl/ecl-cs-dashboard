# Vercel 部署指南

## 步驟 1: 去 Vercel 登入

1. 去 [Vercel](https://vercel.com)
2. 用你嘅 GitHub account 登入
3. 撳 "Add New Project"

## 步驟 2: Import Repository

1. 搜尋 `ecl-cs-dashboard`
2. 撳 "Import"

## 步驟 3: 配置專案

**Framework Preset:** Next.js (自動偵測)

**Build Command:**
```
npm run build
```

**Output Directory:**
```
.next
```

**Install Command:**
```
npm install
```

## 步驟 4: 設置環境變數 (非常重要！)

撳 "Environment Variables" 然後加入以下變數：

### 必須設置嘅變數：

1. **AIRTABLE_API_KEY**
   - Value: 你嘅 Airtable Personal Access Token
   - 去 [Airtable Account](https://airtable.com/create/tokens) 創建
   - 需要以下權限：
     - `data.records:read`
     - `data.records:write`
     - `schema.bases:read`

2. **AIRTABLE_BASE_ID**
   - Value: `appRCQASsApV4C33N`
   - 呢個係你現有嘅 base ID

3. **ANTHROPIC_API_KEY** (可選，用於 AI draft replies)
   - Value: 你嘅 Anthropic API Key
   - 去 [Anthropic Console](https://console.anthropic.com/) 獲取
   - 如果冇呢個 key，AI draft reply 功能會唔work，但其他功能正常

## 步驟 5: 部署

1. 撳 "Deploy"
2. 等待 2-3 分鐘完成 build
3. 完成後會俾你一個 URL，例如：`https://ecl-cs-dashboard.vercel.app`

## 步驟 6: 測試

1. 打開部署嘅 URL
2. 確認 dashboard 能夠正常顯示 cases
3. 測試各個功能

## 之後更新 Code

每次你 push 新 code 去 GitHub，Vercel 會自動重新部署：

```bash
git add .
git commit -m "更新內容"
git push origin main
```

## 自訂網域 (可選)

如果你想用自己嘅網域（例如：cs.yourcompany.com）：

1. 去 Vercel Project Settings
2. 撳 "Domains"
3. 加入你嘅網域
4. 跟住指示更新 DNS 設定

## 故障排除

### 部署失敗
- 檢查 Build Logs 睇錯誤訊息
- 確保所有環境變數都設置正確

### 連接唔到 Airtable
- 檢查 AIRTABLE_API_KEY 係咪正確
- 檢查 API key 嘅權限
- 確認 base ID 正確

### AI Draft Reply 唔 work
- 檢查 ANTHROPIC_API_KEY 係咪設置咗
- 檢查 API key 係咪有效
- 呢個係可選功能，唔影響其他功能

## 效能優化（已經做咗）

✅ Next.js 14 with App Router
✅ 自動 code splitting
✅ Image optimization
✅ API route caching
✅ Static generation where possible

## 安全提示

⚠️ **絕對唔好** 將 `.env.local` 檔案 commit 去 GitHub
⚠️ 定期更新你嘅 API keys
⚠️ 只俾需要嘅人 access Vercel project

## 監控

Vercel 提供：
- 自動 HTTPS
- 全球 CDN
- Real-time logs
- Analytics
- Error tracking

去 Vercel Dashboard 查看你嘅 deployment 狀態同 logs。
