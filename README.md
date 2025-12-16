# Interactive Code Progress Visualization

This web application visualizes code progress over time using interactive graphs. It allows you to:

1. View multiple progress graphs at once
2. Select and compare snapshots within and across graphs
3. See the differences between code snapshots using a diff viewer
4. Calculate AST (Abstract Syntax Tree) similarity between snapshots

## Setup

### 1. Install Node.js dependencies

```bash
npm install
```

### 2. Install Python dependencies for AST similarity

The AST similarity calculation requires Python and certain packages. Run:

```bash
python setup_ast_similarity.py
```

This will install the required Python packages (`tree-sitter` and `tree-sitter-python`).

### 3. Development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Features

### Multiple Graph Selection

- Select multiple CSV files to display different graphs simultaneously
- Graphs will arrange dynamically in a responsive grid layout

### Snapshot Comparison

- Click on points in any graph to select snapshots
- Select one snapshot for detailed view
- Select two snapshots (from same or different graphs) to compare them

### AST Similarity Analysis

When comparing two code snapshots, the application will automatically calculate and display the AST similarity percentage between them. This uses the `tree-sitter` library to:

1. Parse both code snippets into abstract syntax trees
2. Extract a sequence of tokens from each tree
3. Calculate the similarity ratio between these token sequences

The similarity is displayed as a percentage, with 100% meaning identical code structure.

## Troubleshooting

### AST Similarity Not Working

If the AST similarity calculation fails, check:

1. Python is installed and in your system PATH
2. Run `python setup_ast_similarity.py` again to ensure all dependencies are installed
3. Check the browser console for detailed error messages

### Data Format

This application expects CSV files with the following fields:
- `timestamp`: When the snapshot was taken
- `estimated_progress`: The estimated completion percentage (0-1)
- `real_progress`: The actual completion percentage (0-1)
- `code`: The code snapshot content
- `feedback`: Any feedback for this snapshot
- `outcome`: The outcome for this snapshot
- `similarity_to_final`: How similar this snapshot is to the final version
