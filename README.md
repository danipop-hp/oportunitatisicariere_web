**[OPORTUNITĂȚI ȘI CARIERE](https://oportunitatisicariere.ro/)**
---

**Prerequisites**

Before you begin, ensure you have Node.js (version 16 or newer) installed on your system. Installing Node.js will also automatically install NPM (Node Package Manager).

**Installation**

Follow these steps to download and set up the project:

Clone the repository (Get the clone URL from your GitLab project's "Clone" button)

`git clone <YOUR_GITLAB_PROJECT_URL>`

Navigate into the project directory (Replace folder-name with the actual name of the cloned folder)

`cd folder-name`

Install NPM dependencies This command reads the package.json file and installs all necessary packages into the node_modules folder.

`npm install`

**Running the Project**

To start the development server and work on the project, run the following command:

`npm run dev`

This command will do two things simultaneously:

**It will start Sass** in "watch" mode, automatically compiling any changes from src/scss into the src/dist/main.css file.
**It will start live-server**, which opens the project in a local browser and automatically reloads the page whenever you make changes to HTML, JS, or CSS files.
The project will be accessible at http://localhost:3000.

---

**Installed Packages (Dependencies)** 

This project uses the following development dependencies (devDependencies):

**sass:** The official Dart Sass compiler, used to transpile SCSS code into CSS.
**live-server:** A lightweight, Node.js-based development server that provides live-reloading.
**concurrently:** A utility that allows running multiple NPM commands in parallel (e.g., sass-watch and lite-server at the same time).
**eslint:** A "linting" tool to analyze JavaScript code, find problems, and enforce a consistent coding style.
**stylelint:** A "linting" tool to analyze SCSS/CSS code and enforce a consistent coding style.

---

### 👥 The Team

| Role              | Member          | GitHub                                               |
| ----------------- | --------------- | ---------------------------------------------------- |
| **Product Owner** | Sebastian Boga  | [@sebiboga](https://github.com/sebiboga)             |
| **Project Lead**  | Adelina Moroaca | [@AdelinaMoroaca](https://github.com/AdelinaMoroaca) |
| **Developer**     | Andrei Barari   | [@AndreiBarari](https://github.com/AndreiBarari)     |

---

### 🎨 Design Resources

- **Figma:** [View Design Prototype](https://www.figma.com/design/G7RWf3wdZGZDpsKHrP3lu0/AoC-v2?node-id=0-1&p=f&t=mujqlv7nKZZacbww-0)
