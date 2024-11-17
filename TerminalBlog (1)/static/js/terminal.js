class Terminal {
    constructor() {
        this.expandedPosts = new Set();
        this.commandHistory = [];
        this.historyIndex = -1;
        this.commands = {
            'help': () => this.showHelp(),
            'posts': () => this.listPosts(),
            'bio': () => this.showBio(),
            'clear': () => this.clear(),
            'bored': () => this.listPostsByCategory('bored'),
            'ideas': () => this.listPostsByCategory('ideas'),
            'might delete later': () => this.listPostsByCategory('might delete later'),
            'eureka moment': () => this.listPostsByCategory('eureka moment')
        };
        
        this.setupEventListeners();
    }

    stripHtml(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const cleanText = temp.textContent || temp.innerText || '';
        return cleanText.replace(/\s+/g, ' ').trim();
    }

    setupEventListeners() {
        const input = document.querySelector('.command-input');
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.executeCommand(input.value);
                this.commandHistory.push(input.value);
                this.historyIndex = this.commandHistory.length;
                input.value = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    input.value = this.commandHistory[this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    input.value = this.commandHistory[this.historyIndex];
                } else {
                    this.historyIndex = this.commandHistory.length;
                    input.value = '';
                }
            }
        });
        
        document.addEventListener('click', () => {
            input.focus();
        });

        input.focus();
    }

    print(text, className = '') {
        const output = document.querySelector('.output');
        const line = document.createElement('div');
        
        if (text.startsWith('visitor@blog:~$')) {
            line.innerHTML = text;
            output.appendChild(line);
            
            const spacer = document.createElement('div');
            spacer.innerHTML = '&nbsp;';
            output.appendChild(spacer);
        } else if (text.trim()) {
            line.textContent = text.trim();
            line.className = className;
            output.appendChild(line);
        }
        
        output.scrollTop = output.scrollHeight;
    }

    async executeCommand(input) {
        const trimmedInput = input.trim();
        if (trimmedInput) {
            this.print(`visitor@blog:~$ ${trimmedInput}`);
            const args = trimmedInput.split(' ');
            const command = args[0];
            
            if (this.commands[command]) {
                await this.commands[command](...args.slice(1));
            } else {
                this.print(`Command not found: ${command}. Type 'help' for available commands.`);
            }
        }
    }

    async listPosts() {
        try {
            const response = await fetch('/api/posts');
            const posts = await response.json();
            this.print('Available Posts:');
            
            const categories = {};
            posts.forEach(post => {
                if (!categories[post.category]) {
                    categories[post.category] = [];
                }
                categories[post.category].push(post);
            });
            
            Object.entries(categories).forEach(([category, categoryPosts]) => {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'category-section';
                categoryDiv.innerHTML = `${category.toUpperCase()}:`;
                document.querySelector('.output').appendChild(categoryDiv);
                
                categoryPosts.forEach(post => {
                    const postContainer = document.createElement('div');
                    postContainer.className = 'post-container';
                    postContainer.dataset.postId = post.id;
                    
                    const postLine = document.createElement('div');
                    postLine.innerHTML = `<span class="clickable-post" data-post-id="${post.id}">- ${post.title}</span>`;
                    postContainer.appendChild(postLine);
                    
                    postLine.querySelector('.clickable-post').addEventListener('click', () => {
                        this.viewPost(post.id, postContainer);
                    });
                    
                    document.querySelector('.output').appendChild(postContainer);
                });
            });
        } catch (error) {
            this.print('Error fetching posts');
        }
    }

    async listPostsByCategory(category) {
        try {
            const response = await fetch('/api/posts');
            const posts = await response.json();
            const categoryPosts = posts.filter(post => post.category === category);
            
            this.print(`${category.toUpperCase()}:`);
            
            categoryPosts.forEach(post => {
                const postContainer = document.createElement('div');
                postContainer.className = 'post-container';
                postContainer.dataset.postId = post.id;
                
                const postLine = document.createElement('div');
                postLine.innerHTML = `<span class="clickable-post" data-post-id="${post.id}">- ${post.title}</span>`;
                postContainer.appendChild(postLine);
                
                postLine.querySelector('.clickable-post').addEventListener('click', () => {
                    this.viewPost(post.id, postContainer);
                });
                
                document.querySelector('.output').appendChild(postContainer);
            });
        } catch (error) {
            this.print('Error fetching posts');
        }
    }

    async viewPost(id, container) {
        if (this.expandedPosts.has(id)) return;
        this.expandedPosts.add(id);
        
        try {
            const response = await fetch(`/api/posts/${id}`);
            const post = await response.json();
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'post-content';
            
            // Create a formatted string with proper alignment
            const separator = '─'.repeat(50);  // Use box drawing character for cleaner lines
            const content = [
                separator,
                `Title:    ${post.title}`,
                `Category: ${post.category}`,
                `Date:     ${post.created_at}`,
                separator,
                '',  // Empty line before content
                `${this.stripHtml(post.content)}`,
                '',  // Empty line after content
                separator
            ].join('\n');
            
            contentDiv.innerHTML = content.split('\n').map(line => {
                // Add proper indentation for the content
                return `<div class="content-line">${line}</div>`;
            }).join('');
            
            container.appendChild(contentDiv);
        } catch (error) {
            this.print('Post not found');
            this.expandedPosts.delete(id);
        }
    }

    async showBio() {
        try {
            const response = await fetch('/api/profile');
            const profile = await response.json();
            this.print(`=== Author Bio ===
${profile.bio}

Philosophy:
${profile.philosophy}`);
        } catch (error) {
            this.print('Error fetching author bio');
        }
    }

    showHelp() {
        this.print(`Available commands:
    help              - Show this help message
    posts             - Show all blog posts
    bio               - Display author bio
    clear             - Clear the terminal
    bored             - Show bored posts
    ideas             - Show ideas posts
    might delete later - Show might delete later posts
    eureka moment     - Show eureka moment posts`);
    }

    clear() {
        document.querySelector('.output').innerHTML = '';
        this.expandedPosts.clear();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.terminal = new Terminal();
    window.terminal.print('Welcome to Terminal Blog v1.0.0');
    window.terminal.print('Type "help" for available commands.');
});
