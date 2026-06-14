# Shape Gesture Factory - 開発メモ

## ファイル構成
- `index.html` 1ファイルのみ（約3000行）
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
fastBelt / fastInserter / fastAssembler / splitter / merger

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
'fast-belt'      → 'fastBelt'  など
```

### storage-source セル
- `cell.work.kind` で出力種類を保持（raw/line/triangle/square/pentagon/hexagon）
- タップで種類をサイクル切り替え

### assembler セル
- `cell.work.stored` オブジェクトで材料を蓄積（旧: storedDots/storedLines）
- `cell.work.recipeIdx` でレシピ選択

## ティア構成（TIER_CONFIGS インデックス）
| index | 内容 |
|-------|------|
| 0-7   | T1〜T2 各ステップ |
| 8     | 2-Complete（空req、ボタンで次へ） |
| 9     | 3-1 高速ベルト解放 |
| 10    | 3-2 高速インサーター解放 |
| 11    | 3-3 高速組立機解放 |
| 12    | 3-4 分岐機＆合流機解放 |
| 13    | T3-Complete |

## 過去に踏んだバグ・注意点

- **"2-Complete" のティア判定**は `"2-"` より先にチェックしないと誤マッチする
- **storage-source のタップ処理**は `currentTool !== 'erase'` を条件に入れないと消しゴムで消せなくなる
- **clip-path を使う形状**には `box-shadow` が効かない → `filter: drop-shadow` を使う
- **loadGame マイグレーション**: 旧 `storage-source-line` → `storage-source + work.kind:'line'`、旧 `storedDots/storedLines` → `stored:{}`

## ベルト処理
- `doBeltPass(grid, reserved, types)` で指定セル種類のベルト移動を一括処理
- fast-belt は1tickに2回呼ぶことで2倍速を実現
- `canBeltPushTo(fromDir, toCell)` で方向チェック
- `rotateClockwise(dir)` で splitter/merger の分岐方向計算
