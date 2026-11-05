const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../src');
const changes={
 'components/account/OAuthAuthorizationFlow.vue':[['title="Copy URL"',':title="t(\'admin.accounts.oauth.openai.copySessionUrl\')"']],
 'components/account/CreateAccountModal.vue':[['>Location<',">{{ t('admin.proxies.columns.location') }}<"],['>Service Account JSON<',">{{ t('admin.accounts.vertexSaJsonLabel') }}<"],['>Project ID<',">{{ translateInline('项目 ID', 'Project ID') }}<"],['>Project ID:<',">{{ translateInline('项目 ID', 'Project ID') }}:<"],['>Client Email:<',">{{ translateInline('客户端邮箱', 'Client Email') }}:<"]],
 'components/account/EditAccountModal.vue':[['>Location<',">{{ t('admin.proxies.columns.location') }}<"],['>Project ID<',">{{ translateInline('项目 ID', 'Project ID') }}<"]],
 'components/common/HelpTooltip.vue':[['aria-label="Close"',':aria-label="t(\'common.close\')"']],
 'components/common/NavigationProgress.vue':[['aria-label="Loading"',':aria-label="t(\'common.loading\')"']],
 'components/common/Pagination.vue':[['aria-label="Pagination"',':aria-label="t(\'admin.ops.openaiTokenStats.viewModePagination\')"']],
 'components/common/Toast.vue':[['aria-label="Close notification"',':aria-label="t(\'common.close\')"']],
 'components/keys/UseKeyModal.vue':[['aria-label="Client"',':aria-label="t(\'admin.ops.client\')"'],['aria-label="Tabs"',':aria-label="translateInline(\'选项卡\', \'Tabs\')"']],
 'components/user/profile/TotpSetupModal.vue':[['alt="QR Code"',':alt="t(\'admin.settings.payment.modeQRCode\')"']],
 'features/prompt-audit/components/EndpointPool.vue':[['{{ endpoint.input_limit }} chars',"{{ endpoint.input_limit }} {{ translateInline('字符', 'characters') }}"]],
 'features/prompt-audit/components/FilterDeleteDialog.vue':[['>Filter SHA-256<',">{{ translateInline('筛选条件 SHA-256', 'Filter SHA-256') }}<"]],
 'features/prompt-audit/components/PolicyPanel.vue':[['>priority ·',">{{ t('admin.accounts.priority') }} ·"]],
 'views/user/BatchImageGuideView.vue':[['>Custom ID<',">{{ translateInline('自定义 ID', 'Custom ID') }}<"],['>Prompt<',">{{ translateInline('提示词', 'Prompt') }}<"]],
};
let count=0;
for(const [file,replacements] of Object.entries(changes)){
 const filename=path.join(root,file);let source=fs.readFileSync(filename,'utf8');const original=source;
 for(const [before,after] of replacements){if(!source.includes(before))continue;source=source.split(before).join(after);count++}
 if(source===original)continue;
 if(source.includes('translateInline(')&&!source.includes("import { translateInline }"))source=source.replace('<script setup lang="ts">',"<script setup lang=\"ts\">\nimport { translateInline } from '@/i18n/inline'");
 if(!source.includes('useI18n')&&source.includes("t('common."))source=source.replace('<script setup lang="ts">',"<script setup lang=\"ts\">\nimport { useI18n } from 'vue-i18n'\nconst { t } = useI18n()");
 fs.writeFileSync(filename,source);
}
console.log(`Applied ${count} localized text patterns`);
