# Shape Gesture Factory - 開発メモ

## ⚠️ バージョン管理ルール（必須・例外なし）
- 現在のバージョン: **Ver 1.23**
- **修正・更新・追加を行うたびに Ver を 0.01 ずつ上げる**
- バージョンは `index.html` の `#opening-version` div内のテキスト (`Ver X.XX`) を更新する
- コミット前に必ずバージョンを上げること

## ファイル構成
- `index.html` 1ファイルのみ（約3200行）
- タブ: 工場(Canvas) / 自動化ライン(Grid) / 倉庫(Inventory) / ティア(Progress)

## アイテム・リソース種類

### 形状素材（resources オブジェクト）
| kind | resKey | 表示 |
|------|--------|------|
| raw  | point  | ●   |
| line | line   | ─   |
| triangle | triangle | ▲ |
| square | square | ■ |
| pentagon | pentagon | ⬠ |
| hexagon | hexagon | ⬡ |

### パーツ（parts オブジェクト）
belt / inserter / assembler / storageSource / storageSink /
fastBelt / fastInserter / fastAssembler / splitter / merger / **longInserter**

## 重要なデータ構造

### RECIPES（組立機用レシピ）
```js
{ id, name, label, ingredients: [{kind, count}], output, ticks, unlocksAt? }
```
- `kind` は raw/line/triangle/square/pentagon/hexagon またはパーツ名
- `unlocksAt` は TIER_CONFIGS のインデックス

### CRAFT_RECIPES（手動クラフト用）
```js
{ label, ingredients: [{type, count}] }
```
- **kindでなくtype**（RECIPESと異なる点に注意）

### CELL_TYPE_TO_PART_KEY
セル種類（ハイフン区切り）→ パーツキー（キャメルケース）の対応表
```
'storage-source' → 'storageSource'
'storage-sink'   → 'storageSink'
'fast-belt'      → 'fastBelt'
'long-inserter'  → 'longInserter'  など
```

### storage-source セル
- `cell.work.kind` で出力種類を保持（raw/line/triangle/square/pentagon/hexagon）
- タップで種類をサイクル切り替え

### assembler セル
- `cell.work.stored` オブジェクトで材料を蓄積（旧: storedDots/storedLines）
- `cell.work.recipeIdx` でレシピ選択

### inserter セル共通
- 設置時 `cell.work = { state:'idle', phase:0, heldItem:null }` （nullではない）
- `cell.work.armAngle` : 累積角度（初期値は向き依存: right=90, left=270, down=180, up=0）
- `cell.work.heldItem` : 3フェーズ中に保持中のアイテム

## ティア構成（TIER_CONFIGS インデックス）
| index | 内容 |
|-------|------|
| 0-7   | T1〜T2 各ステップ |
| 8     | 2-Complete（空req、ボタンで次へ） |
| 9     | 3-1 高速ベルト解放 |
| 10    | 3-2 高速インサーター解放 |
| 11    | 3-3 高速組立機解放 |
| 12    | 3-4 分岐機＆合流機解放 |
| 13    | 3-5 ロングアームインサーター解放（hexagon×50, square×30） |
| 14    | T3-Complete（longInserter解放） |

## 過去に踏んだバグ・注意点

- **"2-Complete" のティア判定**は `"2-"` より先にチェックしないと誤マッチする
- **storage-source のタップ処理**は `currentTool !== 'erase'` を条件に入れないと消しゴムで消せなくなる
- **clip-path を使う形状**には `box-shadow` が効かない → `filter: drop-shadow` を使う
- **loadGame マイグレーション**: 旧 `storage-source-line` → `storage-source + work.kind:'line'`、旧 `storedDots/storedLines` → `stored:{}`
- **inserter 設置時** `cell.work = null` にすると renderCell でアーム初期化が走らない → `{ state:'idle', phase:0, heldItem:null }` で初期化すること

## ベルト処理
- `doBeltPass(grid, reserved, types)` で指定セル種類のベルト移動を一括処理
- fast-belt は1tickに2回呼ぶことで2倍速を実現
- `canBeltPushTo(fromDir, toCell)` で方向チェック
- `rotateClockwise(dir)` で splitter/merger の分岐方向計算

## インサーター処理
- `doInserterPass(grid, reserved, types, phased)` で指定セル種類を1パス処理
- inserter / long-inserter: `phased=true`（3フェーズ: grab→hold→drop）、1tick1回
- fast-inserter: `phased=false`（即時）、1tickに2回呼び出しで2倍速
- long-inserter: `isLong` フラグで from/to を2マス先に延長（2マスリーチ）
- fast-inserter のリーチは通常インサーターと同じ1マス（速度のみ2倍）

### アームアニメーション（累積角度方式 Method B）
- `updateArmAngle(cell)` : `cell.work.armAngle += 180` して `cell.el.querySelector('.inserter-arm')` のtransformを更新
- CSS `transition: transform 0.38s ease-in-out` でアニメーション
- **重要**: `renderAll()` はインサーター系セルに対して `renderCell` を呼ばない（アーム要素を維持するため）
  - arm未構築時（初回・タブ切替後）のみ `renderCell` を呼ぶ
  - 以降は querySelector でアーム要素を直接更新
- 遷移タイミング: phase0成功(grab)・phase2成功(drop)・fast-inserter成功 の各タイミングで `updateArmAngle` 呼び出し

## クラフトモード UI
- `setFactoryMode('craft')` でキャンバスと操作説明を非表示（`display:none`）
- `setFactoryMode('factory')` で再表示
- 部品選択UI：上段に選択中部品を大きく表示（`#craft-selected-label` / `#craft-selected-count`）、下段にアイコン＋在庫数チップを横並び（`.craft-part-chips`）
- `selectCraftTarget(partType)` 呼び出しで上段表示も同期
- `updatePartsDisplay()` でチップの在庫数と上段の在庫数を両方更新

## グリッドレイアウト
- `#stage-container` は `width: fit-content` で中身に合わせたサイズ（はみ出しグレー防止）
