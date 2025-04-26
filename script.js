window.onload = function () {
    if (localStorage.getItem("loggedInUser")) {
        showMainContent();
        renderCommunities();
        renderFeed();
    } else {
        document.getElementById("loginContainer").style.display = "block";
    }
};

let button = document.getElementById('Mode-btn').addEventListener('click',function(){
  let currTheme= localStorage.getItem('theme');
  if(currTheme =='light'){
    localStorage.setItem('theme','dark');
    document.body.style.backgroundColor = "Black";
    document.body.style.color= "white";
  }
  else{
    localStorage.setItem('theme','light');
    document.body.style.backgroundColor = "white";
    document.body.style.color= "black";
  }
})

function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    // Fixed credentials
    const validUsername = "bishtsarthak80@gmail.com";
    const validPassword = "ricky@123";

    console.log("Login attempt details:");
    console.log("Entered username:", username);
    console.log("Entered password:", password);
    console.log("Valid username:", validUsername);
    console.log("Valid password:", validPassword);
    console.log("Username match:", username === validUsername);
    console.log("Password match:", password === validPassword);

    if (!username || !password) {
        alert("Please enter both email and password.");
        return;
    }

    // Exact comparison with type checking
    if (username === validUsername && password === validPassword) {
        console.log("Login successful - credentials match exactly");
        localStorage.setItem("loggedInUser", username);
        showMainContent();
        renderCommunities();
        renderFeed();
    } else {
        console.log("Login failed - credentials do not match");
        alert("Invalid email or password. Please try again.");
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
    }
}

function logout() {
    localStorage.removeItem("loggedInUser");
    document.getElementById("mainContent").style.display = "none";
    document.getElementById("loginContainer").style.display = "block";
}

function showMainContent() {
    console.log("Showing main content"); // Debug log
    document.getElementById("loginContainer").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
}

// Community Management
function createCommunity() {
    const communityName = document.getElementById("communityName").value.trim();
    if (!communityName) return alert("Enter a community name.");

    let communities = JSON.parse(localStorage.getItem("communities") || "[]");
    
    if (communities.some(c => c.name === communityName)) {
        alert("Community already exists.");
        return;
    }

    const newCommunity = {
        id: Date.now(),
        name: communityName,
        members: [localStorage.getItem("loggedInUser")],
        posts: []
    };

    communities.push(newCommunity);
    localStorage.setItem("communities", JSON.stringify(communities));
    renderCommunities();
    document.getElementById("communityName").value = "";
}

function renderCommunities() {
    const communityList = document.getElementById("communityList");
    communityList.innerHTML = "";

    const communities = JSON.parse(localStorage.getItem("communities") || "[]");
    const currentUser = localStorage.getItem("loggedInUser");

    communities.forEach(community => {
        const li = document.createElement("li");
        const isMember = community.members.includes(currentUser);
        
        li.innerHTML = `
            <div class="community-item">
                <span>${community.name}</span>
                <div class="community-actions">
                    ${!isMember ? `<button onclick="joinCommunity(${community.id})">Join</button>` : ''}
                    <button onclick="viewCommunity(${community.id})">View</button>
                </div>
            </div>
        `;
        communityList.appendChild(li);
    });
}

function joinCommunity(communityId) {
    const currentUser = localStorage.getItem("loggedInUser");
    let communities = JSON.parse(localStorage.getItem("communities") || "[]");
    const community = communities.find(c => c.id === communityId);
    
    if (community && !community.members.includes(currentUser)) {
        community.members.push(currentUser);
        localStorage.setItem("communities", JSON.stringify(communities));
        renderCommunities();
    }
}

function viewCommunity(communityId) {
    const communities = JSON.parse(localStorage.getItem("communities") || "[]");
    const community = communities.find(c => c.id === communityId);
    if (community) {
        // Mark this community as active
        communities.forEach(c => c.active = c.id === communityId);
        localStorage.setItem("communities", JSON.stringify(communities));
        renderFeed(communityId);
    }
}

// Post Management
function createPost() {
    const content = document.getElementById("postContent").value.trim();
    const mediaFile = document.getElementById("postMedia").files[0];
    const currentUser = localStorage.getItem("loggedInUser");

    if (!content && !mediaFile) return alert("Post something or upload media.");

    const reader = new FileReader();
    reader.onloadend = function () {
        const mediaURL = mediaFile ? reader.result : null;

        let communities = JSON.parse(localStorage.getItem("communities") || "[]");
        const activeCommunity = communities.find(c => c.active);
        
        if (!activeCommunity) {
            alert("Please select a community first by clicking 'View' on a community");
            return;
        }

        const newPost = {
            id: Date.now(),
            user: currentUser,
            content: content,
            media: mediaURL,
            likes: [],
            comments: [],
            timestamp: new Date().toISOString()
        };

        if (!activeCommunity.posts) {
            activeCommunity.posts = [];
        }
        activeCommunity.posts.unshift(newPost);
        localStorage.setItem("communities", JSON.stringify(communities));

        document.getElementById("postContent").value = "";
        document.getElementById("postMedia").value = "";

        renderFeed(activeCommunity.id);
    };

    if (mediaFile) {
        reader.readAsDataURL(mediaFile);
    } else {
        reader.onloadend();
    }
}

function timeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
}

function renderFeed(communityId = null) {
    const feed = document.getElementById("feed");
    if (!feed) {
        console.error("Feed element not found");
        return;
    }
    feed.innerHTML = "";

    const communities = JSON.parse(localStorage.getItem("communities") || "[]");
    const currentUser = localStorage.getItem("loggedInUser");
    
    let posts = [];
    if (communityId) {
        const community = communities.find(c => c.id === communityId);
        if (community) {
            posts = community.posts || [];
        }
    } else {
        communities.forEach(community => {
            if (community.posts) {
                posts = posts.concat(community.posts);
            }
        });
        posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    if (posts.length === 0) {
        feed.innerHTML = "<p>No posts yet. Be the first to post!</p>";
        return;
    }

    posts.forEach(post => {
        const postDiv = document.createElement("div");
        postDiv.className = "post";
        
        const isLiked = post.likes && post.likes.includes(currentUser);
        const mediaHTML = post.media
            ? (post.media.startsWith("data:video") 
                ? `<video controls width="300"><source src="${post.media}"></video>` 
                : `<img src="${post.media}" width="300"/>`)
            : "";

        const commentsHTML = post.comments ? post.comments.map(comment => `
            <div class="comment">
                <strong>${comment.user}:</strong> ${comment.content}
                <span class="timestamp">${timeAgo(comment.timestamp)}</span>
            </div>
        `).join("") : "";

        postDiv.innerHTML = `
            <div class="post-header">
                <strong>${post.user}</strong>
                <span class="timestamp">${timeAgo(post.timestamp)}</span>
            </div>
            <p>${post.content}</p>
            ${mediaHTML}
            <div class="post-actions">
                <button class="like-button" onclick="likePost(${post.id})" style="color:${isLiked ? 'red' : 'black'}">
                    ❤️ ${post.likes ? post.likes.length : 0}
                </button>
            </div>
            <div class="comment-section">
                <input type="text" class="comment-input" id="comment-${post.id}" placeholder="Write a comment...">
                <button class="comment-button" onclick="submitComment(${post.id})">Comment</button>
                <div class="comments-container">
                    ${commentsHTML}
                </div>
            </div>
        `;

        feed.appendChild(postDiv);
    });
}

function likePost(postId) {
    const currentUser = localStorage.getItem("loggedInUser");
    if (!currentUser) {
        alert("Please login to like posts");
        return;
    }

    let communities = JSON.parse(localStorage.getItem("communities") || "[]");
    if (!communities || communities.length === 0) {
        console.error("No communities found");
        return;
    }

    let found = false;
    for (const community of communities) {
        if (!community.posts) {
            community.posts = [];
            continue;
        }
        const post = community.posts.find(p => p.id === postId);
        if (post) {
            if (!post.likes) {
                post.likes = [];
            }
            const userIndex = post.likes.indexOf(currentUser);
            if (userIndex === -1) {
                post.likes.push(currentUser);
            } else {
                post.likes.splice(userIndex, 1);
            }
            localStorage.setItem("communities", JSON.stringify(communities));
            renderFeed(community.id);
            found = true;
            break;
        }
    }

    if (!found) {
        console.error("Post not found");
    }
}

function submitComment(postId) {
    const currentUser = localStorage.getItem("loggedInUser");
    if (!currentUser) {
        alert("Please login to comment");
        return;
    }

    const commentInput = document.getElementById(`comment-${postId}`);
    if (!commentInput) {
        console.error("Comment input not found");
        return;
    }

    const comment = commentInput.value.trim();
    if (!comment) {
        alert("Please write a comment first");
        return;
    }

    let communities = JSON.parse(localStorage.getItem("communities") || "[]");
    if (!communities || communities.length === 0) {
        console.error("No communities found");
        return;
    }

    let found = false;
    for (const community of communities) {
        if (!community.posts) {
            community.posts = [];
            continue;
        }
        const post = community.posts.find(p => p.id === postId);
        if (post) {
            if (!post.comments) {
                post.comments = [];
            }
            const newComment = {
                id: Date.now(),
                user: currentUser,
                content: comment,
                timestamp: new Date().toISOString()
            };
            
            post.comments.push(newComment);
            localStorage.setItem("communities", JSON.stringify(communities));
            renderFeed(community.id);
            commentInput.value = "";
            found = true;
            break;
        }
    }

    if (!found) {
        console.error("Post not found");
    }
}

function replyToComment(postId, commentId) {
    const reply = prompt("Write your reply:");
    if (!reply) return;

    const currentUser = localStorage.getItem("loggedInUser");
    let communities = JSON.parse(localStorage.getItem("communities") || "[]");
    
    for (const community of communities) {
        const post = community.posts.find(p => p.id === postId);
        if (post) {
            const comment = post.comments.find(c => c.id === commentId);
            if (comment) {
                comment.replies.push({
                    user: currentUser,
                    content: reply,
                    timestamp: new Date().toISOString()
                });
                localStorage.setItem("communities", JSON.stringify(communities));
                renderFeed(community.id);
                break;
            }
        }
    }
}

// Real-time updates
window.addEventListener('storage', function(e) {
    if (e.key === 'communities') {
        renderCommunities();
        const communities = JSON.parse(localStorage.getItem("communities") || "[]");
        const activeCommunity = communities.find(c => c.active);
        if (activeCommunity) {
            renderFeed(activeCommunity.id);
        } else {
            renderFeed();
        }
    }
});
