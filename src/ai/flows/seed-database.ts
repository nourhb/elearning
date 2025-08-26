import { getAdminServices } from '@/lib/firebase-admin';
import { DEFAULT_PLACEHOLDER_IMAGE } from '@/lib/constants';

export async function seedDatabase(): Promise<string> {
    const { db } = getAdminServices();
    
    try {
        // Check if courses already exist
        const existingCourses = await db.collection('courses').limit(1).get();
        if (!existingCourses.empty) {
            return 'Database already contains courses. Skipping seed.';
        }

        // Create sample courses
        const sampleCourses = [
            {
                title: 'Introduction to Web Development',
                description: 'Learn the fundamentals of web development including HTML, CSS, and JavaScript. Perfect for beginners who want to start their journey in web development.',
                instructorId: 'system', // Will be updated when instructors are created
                imageUrl: DEFAULT_PLACEHOLDER_IMAGE,
                aiHint: 'This course covers basic web development concepts and is suitable for complete beginners.',
                status: 'Published',
                studentCount: 0,
                modules: [
                    {
                        id: 'module-1',
                        title: 'HTML Basics',
                        lessons: [
                            {
                                id: 'lesson-1-1',
                                title: 'Introduction to HTML',
                                content: 'Learn the basics of HTML markup language.',
                                duration: 15
                            },
                            {
                                id: 'lesson-1-2',
                                title: 'HTML Elements and Tags',
                                content: 'Understanding HTML elements and how to use them.',
                                duration: 20
                            }
                        ]
                    },
                    {
                        id: 'module-2',
                        title: 'CSS Fundamentals',
                        lessons: [
                            {
                                id: 'lesson-2-1',
                                title: 'Introduction to CSS',
                                content: 'Learn how to style your HTML with CSS.',
                                duration: 18
                            }
                        ]
                    }
                ]
            },
            {
                title: 'JavaScript Fundamentals',
                description: 'Master the basics of JavaScript programming language. Learn variables, functions, and control structures.',
                instructorId: 'system',
                imageUrl: DEFAULT_PLACEHOLDER_IMAGE,
                aiHint: 'This course is designed for students who have basic HTML knowledge and want to learn JavaScript.',
                status: 'Published',
                studentCount: 0,
                modules: [
                    {
                        id: 'module-1',
                        title: 'JavaScript Basics',
                        lessons: [
                            {
                                id: 'lesson-1-1',
                                title: 'Variables and Data Types',
                                content: 'Learn about variables and different data types in JavaScript.',
                                duration: 25
                            }
                        ]
                    }
                ]
            },
            {
                title: 'React Development',
                description: 'Build modern web applications with React. Learn components, state management, and hooks.',
                instructorId: 'system',
                imageUrl: DEFAULT_PLACEHOLDER_IMAGE,
                aiHint: 'This course requires JavaScript knowledge and covers React fundamentals.',
                status: 'Published',
                studentCount: 0,
                modules: [
                    {
                        id: 'module-1',
                        title: 'React Components',
                        lessons: [
                            {
                                id: 'lesson-1-1',
                                title: 'Introduction to React',
                                content: 'Learn the basics of React and component-based architecture.',
                                duration: 30
                            }
                        ]
                    }
                ]
            }
        ];

        // Create sample discussions
        const sampleDiscussions = [
            {
                title: "Getting Started with React",
                content: "I'm new to React and looking for tips on how to get started. What resources would you recommend for a beginner?",
                authorId: "system",
                authorName: "React Learner",
                category: "technical",
                tags: ["react", "beginner", "javascript"],
                likes: 12,
                replies: 3,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                isPinned: false,
                isLocked: false,
            },
            {
                title: "Best Practices for JavaScript",
                content: "What are some JavaScript best practices that every developer should know? I want to improve my code quality.",
                authorId: "system",
                authorName: "JS Developer",
                category: "technical",
                tags: ["javascript", "best-practices", "coding"],
                likes: 8,
                replies: 2,
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                isPinned: false,
                isLocked: false,
            },
            {
                title: "CSS Grid vs Flexbox",
                content: "When should I use CSS Grid vs Flexbox? I'm confused about which one to choose for different layouts.",
                authorId: "system",
                authorName: "CSS Enthusiast",
                category: "help",
                tags: ["css", "grid", "flexbox", "layout"],
                likes: 15,
                replies: 4,
                createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
                updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
                isPinned: true,
                isLocked: false,
            },
            {
                title: "My First Web App",
                content: "Just completed my first web application using HTML, CSS, and JavaScript! Here's what I learned...",
                authorId: "system",
                authorName: "Web Dev Newbie",
                category: "showcase",
                tags: ["showcase", "first-project", "html", "css", "javascript"],
                likes: 25,
                replies: 6,
                createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
                updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
                isPinned: false,
                isLocked: false,
            },
            {
                title: "Learning Path for Frontend Development",
                content: "What's the recommended learning path for someone who wants to become a frontend developer?",
                authorId: "system",
                authorName: "Career Changer",
                category: "general",
                tags: ["career", "frontend", "learning-path"],
                likes: 18,
                replies: 5,
                createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
                updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
                isPinned: false,
                isLocked: false,
            }
        ];

        // Create sample replies
        const sampleReplies = [
            {
                content: "Great question! I'd recommend starting with the official React documentation and then building small projects to practice.",
                authorId: "system",
                authorName: "React Expert",
                likes: 5,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 days ago + 2 hours
                updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
                isSolution: true,
            },
            {
                content: "Always use meaningful variable names, avoid global variables, and learn about closures and scope.",
                authorId: "system",
                authorName: "Senior Developer",
                likes: 3,
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000), // 1 day ago + 1 hour
                updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
                isSolution: false,
            },
            {
                content: "Use Grid for 2D layouts and Flexbox for 1D layouts. Grid is great for overall page structure, Flexbox for components.",
                authorId: "system",
                authorName: "CSS Master",
                likes: 7,
                createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 30 * 60 * 1000), // 12 hours ago + 30 minutes
                updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 30 * 60 * 1000),
                isSolution: true,
            }
        ];

        // Create sample achievements
        const sampleAchievements = [
            {
                id: "first-discussion",
                name: "First Discussion",
                description: "Started your first community discussion",
                icon: "💬",
                criteria: "Create your first discussion post"
            },
            {
                id: "helpful-member",
                name: "Helpful Member",
                description: "Received 10 likes on your posts",
                icon: "👍",
                criteria: "Get 10 total likes across all posts"
            },
            {
                id: "solution-provider",
                name: "Solution Provider",
                description: "Provided a solution to someone's question",
                icon: "✅",
                criteria: "Have a reply marked as solution"
            },
            {
                id: "active-contributor",
                name: "Active Contributor",
                description: "Made 5 posts in the community",
                icon: "🌟",
                criteria: "Create 5 discussion posts"
            }
        ];

        // Create sample quizzes
        const sampleQuizzes = [
            {
                title: "HTML Basics Quiz",
                description: "Test your knowledge of HTML fundamentals including elements, tags, and structure.",
                courseId: "web-dev-course", // Will be updated with actual course ID
                questions: [
                    {
                        id: "html-q1",
                        question: "What does HTML stand for?",
                        options: [
                            "Hyper Text Markup Language",
                            "High Tech Modern Language",
                            "Home Tool Markup Language",
                            "Hyperlink and Text Markup Language"
                        ],
                        correctAnswer: 0,
                        explanation: "HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.",
                        points: 10,
                        difficulty: "easy",
                        category: "basics"
                    },
                    {
                        id: "html-q2",
                        question: "Which HTML element is used to define a paragraph?",
                        options: ["<p>", "<paragraph>", "<text>", "<para>"],
                        correctAnswer: 0,
                        explanation: "The <p> element is used to define a paragraph in HTML.",
                        points: 10,
                        difficulty: "easy",
                        category: "elements"
                    },
                    {
                        id: "html-q3",
                        question: "What is the correct HTML element for inserting a line break?",
                        options: ["<break>", "<lb>", "<br>", "<linebreak>"],
                        correctAnswer: 2,
                        explanation: "The <br> element is used to insert a line break in HTML.",
                        points: 10,
                        difficulty: "easy",
                        category: "elements"
                    }
                ],
                timeLimit: 10, // 10 minutes
                passingScore: 70, // 70%
                maxAttempts: 3,
                isActive: true,
                createdBy: "system"
            },
            {
                title: "JavaScript Fundamentals Quiz",
                description: "Test your understanding of JavaScript basics including variables, data types, and functions.",
                courseId: "js-course", // Will be updated with actual course ID
                questions: [
                    {
                        id: "js-q1",
                        question: "How do you declare a variable in JavaScript?",
                        options: [
                            "var x = 5;",
                            "variable x = 5;",
                            "v x = 5;",
                            "declare x = 5;"
                        ],
                        correctAnswer: 0,
                        explanation: "In JavaScript, you can declare variables using 'var', 'let', or 'const'.",
                        points: 10,
                        difficulty: "easy",
                        category: "variables"
                    },
                    {
                        id: "js-q2",
                        question: "Which of the following is NOT a JavaScript data type?",
                        options: ["string", "number", "boolean", "character"],
                        correctAnswer: 3,
                        explanation: "JavaScript doesn't have a 'character' data type. It uses 'string' for both single and multiple characters.",
                        points: 15,
                        difficulty: "medium",
                        category: "data-types"
                    },
                    {
                        id: "js-q3",
                        question: "What is the output of: console.log(typeof null);",
                        options: ["null", "undefined", "object", "number"],
                        correctAnswer: 2,
                        explanation: "typeof null returns 'object' in JavaScript, which is a known quirk of the language.",
                        points: 20,
                        difficulty: "hard",
                        category: "data-types"
                    }
                ],
                timeLimit: 15, // 15 minutes
                passingScore: 75, // 75%
                maxAttempts: 2,
                isActive: true,
                createdBy: "system"
            },
            {
                title: "React Basics Quiz",
                description: "Test your knowledge of React fundamentals including components, props, and state.",
                courseId: "react-course", // Will be updated with actual course ID
                questions: [
                    {
                        id: "react-q1",
                        question: "What is a React component?",
                        options: [
                            "A JavaScript function or class that returns JSX",
                            "A CSS file for styling",
                            "A database table",
                            "A server-side script"
                        ],
                        correctAnswer: 0,
                        explanation: "A React component is a JavaScript function or class that returns JSX to describe what should appear on the screen.",
                        points: 10,
                        difficulty: "easy",
                        category: "components"
                    },
                    {
                        id: "react-q2",
                        question: "How do you pass data to a child component in React?",
                        options: ["Using state", "Using props", "Using context", "Using refs"],
                        correctAnswer: 1,
                        explanation: "Props are used to pass data from parent to child components in React.",
                        points: 15,
                        difficulty: "medium",
                        category: "props"
                    },
                    {
                        id: "react-q3",
                        question: "What hook would you use to manage state in a functional component?",
                        options: ["useState", "useEffect", "useContext", "useReducer"],
                        correctAnswer: 0,
                        explanation: "useState is the hook used to manage state in functional components.",
                        points: 15,
                        difficulty: "medium",
                        category: "hooks"
                    }
                ],
                timeLimit: 12, // 12 minutes
                passingScore: 80, // 80%
                maxAttempts: 2,
                isActive: true,
                createdBy: "system"
            }
        ];

        const batch = db.batch();

        // Add courses to database
        const courseRefs: any[] = [];
        sampleCourses.forEach(course => {
            const courseRef = db.collection('courses').doc();
            courseRefs.push(courseRef);
            batch.set(courseRef, course);
        });

        // Add discussions to database
        const discussionRefs: any[] = [];
        sampleDiscussions.forEach(discussion => {
            const discussionRef = db.collection('discussions').doc();
            discussionRefs.push(discussionRef);
            batch.set(discussionRef, discussion);
        });

        // Add replies to database (with actual discussion IDs)
        sampleReplies.forEach((reply, index) => {
            const replyRef = db.collection('replies').doc();
            const updatedReply = {
                ...reply,
                discussionId: discussionRefs[index % discussionRefs.length].id
            };
            batch.set(replyRef, updatedReply);
        });

        // Add achievements to database
        sampleAchievements.forEach(achievement => {
            const achievementRef = db.collection('achievements').doc(achievement.id);
            batch.set(achievementRef, achievement);
        });

        // Add quizzes to database (with actual course IDs and real questions)
        const realQuizzes = [
            {
                title: 'HTML Fundamentals Quiz',
                description: 'Test your knowledge of HTML basics, tags, and structure',
                courseId: courseRefs[0].id,
                questions: [
                    {
                        id: 'q1',
                        text: 'What does HTML stand for?',
                        options: [
                            'Hyper Text Markup Language',
                            'High Tech Modern Language',
                            'Home Tool Markup Language',
                            'Hyperlink and Text Markup Language'
                        ],
                        correctAnswer: 0,
                        explanation: 'HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.',
                        points: 1
                    },
                    {
                        id: 'q2',
                        text: 'Which HTML tag is used to define a paragraph?',
                        options: ['<p>', '<paragraph>', '<text>', '<para>'],
                        correctAnswer: 0,
                        explanation: 'The <p> tag is used to define paragraphs in HTML.',
                        points: 1
                    },
                    {
                        id: 'q3',
                        text: 'What is the correct HTML element for inserting a line break?',
                        options: ['<break>', '<br>', '<lb>', '<linebreak>'],
                        correctAnswer: 1,
                        explanation: 'The <br> tag is used to insert a line break in HTML.',
                        points: 1
                    },
                    {
                        id: 'q4',
                        text: 'Which attribute is used to specify that an input field must be filled out?',
                        options: ['placeholder', 'formvalidate', 'required', 'validate'],
                        correctAnswer: 2,
                        explanation: 'The "required" attribute specifies that an input field must be filled out before submitting the form.',
                        points: 1
                    },
                    {
                        id: 'q5',
                        text: 'What is the correct HTML for creating a hyperlink?',
                        options: [
                            '<a url="http://www.example.com">Example</a>',
                            '<a href="http://www.example.com">Example</a>',
                            '<a>http://www.example.com</a>',
                            '<link>http://www.example.com</link>'
                        ],
                        correctAnswer: 1,
                        explanation: 'The correct syntax is <a href="url">link text</a>',
                        points: 1
                    }
                ],
                timeLimit: 15,
                passingScore: 70,
                maxAttempts: 3,
                isActive: true,
                createdBy: 'system'
            },
            {
                title: 'JavaScript Basics Quiz',
                description: 'Test your understanding of JavaScript fundamentals and syntax',
                courseId: courseRefs[1].id,
                questions: [
                    {
                        id: 'q1',
                        text: 'How do you declare a variable in JavaScript?',
                        options: [
                            'var variableName;',
                            'variable variableName;',
                            'v variableName;',
                            'declare variableName;'
                        ],
                        correctAnswer: 0,
                        explanation: 'Variables in JavaScript are declared using var, let, or const keywords.',
                        points: 1
                    },
                    {
                        id: 'q2',
                        text: 'Which operator is used to assign a value to a variable?',
                        options: ['*', '=', '==', '==='],
                        correctAnswer: 1,
                        explanation: 'The = operator is used for assignment in JavaScript.',
                        points: 1
                    },
                    {
                        id: 'q3',
                        text: 'What is the correct way to write a JavaScript array?',
                        options: [
                            'var colors = "red", "green", "blue";',
                            'var colors = (1:"red", 2:"green", 3:"blue");',
                            'var colors = ["red", "green", "blue"];',
                            'var colors = 1 = ("red"), 2 = ("green"), 3 = ("blue");'
                        ],
                        correctAnswer: 2,
                        explanation: 'Arrays in JavaScript are written with square brackets and comma-separated values.',
                        points: 1
                    },
                    {
                        id: 'q4',
                        text: 'How do you call a function named "myFunction"?',
                        options: [
                            'call myFunction();',
                            'call function myFunction();',
                            'myFunction();',
                            'function myFunction();'
                        ],
                        correctAnswer: 2,
                        explanation: 'Functions are called by writing the function name followed by parentheses.',
                        points: 1
                    },
                    {
                        id: 'q5',
                        text: 'What will the following code return: Boolean(10 > 9)?',
                        options: ['NaN', 'false', 'true', 'undefined'],
                        correctAnswer: 2,
                        explanation: 'The comparison 10 > 9 evaluates to true, and Boolean(true) returns true.',
                        points: 1
                    }
                ],
                timeLimit: 20,
                passingScore: 75,
                maxAttempts: 2,
                isActive: true,
                createdBy: 'system'
            },
            {
                title: 'React Fundamentals Quiz',
                description: 'Test your knowledge of React components, state, and props',
                courseId: courseRefs[2].id,
                questions: [
                    {
                        id: 'q1',
                        text: 'What is React?',
                        options: [
                            'A programming language',
                            'A JavaScript library for building user interfaces',
                            'A database management system',
                            'A web server'
                        ],
                        correctAnswer: 0,
                        explanation: 'React is a JavaScript library developed by Facebook for building user interfaces.',
                        points: 1
                    },
                    {
                        id: 'q2',
                        text: 'Which hook is used to manage state in functional components?',
                        options: ['useState', 'useEffect', 'useContext', 'useReducer'],
                        correctAnswer: 0,
                        explanation: 'useState is the hook used to add state to functional components.',
                        points: 1
                    },
                    {
                        id: 'q3',
                        text: 'What is JSX?',
                        options: [
                            'A new programming language',
                            'A syntax extension for JavaScript',
                            'A database query language',
                            'A CSS framework'
                        ],
                        correctAnswer: 1,
                        explanation: 'JSX is a syntax extension for JavaScript that allows you to write HTML-like code in JavaScript.',
                        points: 1
                    },
                    {
                        id: 'q4',
                        text: 'How do you pass data from a parent component to a child component?',
                        options: ['Using state', 'Using props', 'Using context', 'Using refs'],
                        correctAnswer: 1,
                        explanation: 'Props are used to pass data from parent to child components in React.',
                        points: 1
                    },
                    {
                        id: 'q5',
                        text: 'What is the purpose of the useEffect hook?',
                        options: [
                            'To manage component state',
                            'To perform side effects in functional components',
                            'To create custom hooks',
                            'To optimize performance'
                        ],
                        correctAnswer: 1,
                        explanation: 'useEffect is used to perform side effects in functional components, such as data fetching or subscriptions.',
                        points: 1
                    }
                ],
                timeLimit: 25,
                passingScore: 80,
                maxAttempts: 2,
                isActive: true,
                createdBy: 'system'
            }
        ];

        realQuizzes.forEach((quiz, index) => {
            const quizRef = db.collection('quizzes').doc();
            batch.set(quizRef, quiz);
        });

        await batch.commit();

        return `Successfully seeded database with ${sampleCourses.length} courses, ${sampleDiscussions.length} discussions, ${sampleReplies.length} replies, ${sampleAchievements.length} achievements, and ${realQuizzes.length} quizzes.`;
    } catch (error: any) {
        console.error('Error seeding database:', error);
        throw new Error(`Failed to seed database: ${error.message}`);
    }
}


