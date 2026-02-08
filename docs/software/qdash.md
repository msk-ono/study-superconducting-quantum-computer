# QDash (Qubit Calibration Platform)

QDash は、量子ビットのキャリブレーションワークフローを管理・監視するためのプラットフォームです。
複雑化するキャリブレーションタスクを効率的に実行し、データの可視化や分析を支援します。

## 主な機能 (Features)

- **Workflow Management**:
    - キャリブレーション手順 (DAG) の定義と実行管理
    - リアルタイムの進捗監視

- **Data Analysis**:
    - 測定データ (時系列データ、ブロッホ球など) の可視化
    - 過去のキャリブレーション履歴 (Provenance) の管理

- **Parameter Control**:
    - 実験パラメータ (周波数、振幅、パルス幅など) の一元管理
    - `config` ディレクトリやデータベースによる設定保存

## アーキテクチャ

QDash は主に以下のコンポーネントで構成されています。

- **Frontend (UI)**: React/Next.js ベースのユーザーインターフェース (可視化、操作)
- **Backend (API)**: FastAPI ベースのサーバー (測定器との通信、DB操作)
- **Database**: PostgreSQL (メタデータ), MongoDB (測定データ)
- **Workflow Engine**: 依存関係に基づいたタスクスケジューリング

### CalibOrchestrator

キャリブレーション実行の中核となるクラスが `qdash.workflow.engine.orchestrator.CalibOrchestrator` です。
セッションのライフサイクル全体を管理します。

1.  **Initialize**:
    - ディレクトリ構造の作成 (`calib_data`, `calib_note`, `fig` 等)。
    - `ExecutionService` の初期化 (DBへの実行記録作成)。
    - `TaskContext` の初期化 (タスク間のデータ共有)。
    - `Backend` (Qubex等) の接続。

2.  **Run Task**:
    - タスクインスタンスの生成 (`_create_task_instance`)。
    - 依存関係の解決 (`upstream_id` の設定)。
    - Prefect タスクとしての実行 (`_run_prefect_task`)。
    - 結果のマージ (`_merge_and_extract_results`)。

3.  **Complete**:
    - 実行ステータスの更新 (Success/Fail)。
    - チップ履歴 (Chip History) の更新。
    - キャリブレーションノート (JSON) のエクスポート。

## ディレクトリ構造 (externals/qdash)

- `src/`: バックエンドソースコード
    - `qdash/workflow/`: キャリブレーションワークフローの定義
    - `qdash/api/`: APIエンドポイント
- `ui/`: フロントエンドソースコード
- `docs/`: ドキュメント (VitePress)
