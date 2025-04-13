import React, { useState, useEffect } from 'react';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  increment,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Button, Card, Spinner, Alert, Badge } from 'react-bootstrap';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaHeart,
  FaComment,
  FaShare,
  FaBookmark,
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeContext';

const BlogPost = () => {
  const { theme } = useTheme();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postRef = doc(db, 'blogPosts', id);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
          const postData = postSnap.data();
          setPost(postData);
          setViews(postData.views || 0);
          setLikes(postData.likes || 0);

          // Update view count
          await updateDoc(postRef, {
            views: increment(1),
          });
        } else {
          setError('Post not found');
        }
      } catch (err) {
        setError('Error loading post: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleLike = async () => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    try {
      const postRef = doc(db, 'blogPosts', id);
      if (isLiked) {
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: arrayUnion(auth.currentUser.uid),
        });
        setLikes(likes - 1);
      } else {
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: arrayUnion(auth.currentUser.uid),
        });
        setLikes(likes + 1);
      }
      setIsLiked(!isLiked);
    } catch (err) {
      console.error('Error updating like:', err);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner
          animation="border"
          variant={theme === 'dark' ? 'light' : 'dark'}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
        <Button
          variant="primary"
          onClick={() => navigate('/blog')}
          className="d-flex align-items-center"
        >
          <FaArrowLeft className="me-2" />
          Back to Blog
        </Button>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <motion.div
      className={`blog-post-container ${theme} py-5`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Helmet>
        <title>{post.title} | Future Car Blog</title>
        <meta name="description" content={post.content.substring(0, 160)} />
        {post.tags && <meta name="keywords" content={post.tags.join(', ')} />}
      </Helmet>

      <div className="container">
        <Button
          variant="outline-primary"
          onClick={() => navigate('/blog')}
          className="mb-5 d-flex align-items-center"
        >
          <FaArrowLeft className="me-2" />
          Back to Blog
        </Button>

        <Card className="glassmorphism-card">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <span className="text-muted">{formatDate(post.createdAt)}</span>
              <span className="text-muted">{views} views</span>
            </div>

            <h1 className="display-4 fw-bold mb-4 text-gradient">
              {post.title}
            </h1>

            <div className="author-badge mb-5">
              <span className="text-muted">By {post.author}</span>
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="mb-5">
                {post.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    className="me-2 mb-2"
                    style={{ backgroundColor: 'var(--accent-color)' }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div
              className="blog-content fs-5 mb-5"
              style={{ lineHeight: '1.8' }}
              dangerouslySetInnerHTML={{
                __html: post.content.replace(/\n/g, '<br />'),
              }}
            />

            <div className="post-actions d-flex justify-content-between align-items-center">
              <Button
                variant={isLiked ? 'primary' : 'outline-primary'}
                onClick={handleLike}
                className="d-flex align-items-center"
              >
                <FaHeart className="me-2" />
                {likes} Likes
              </Button>

              <div className="d-flex gap-3">
                <Button variant="outline-primary">
                  <FaComment className="me-2" />
                  Comment
                </Button>
                <Button variant="outline-primary">
                  <FaShare className="me-2" />
                  Share
                </Button>
                <Button variant="outline-primary">
                  <FaBookmark className="me-2" />
                  Save
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </motion.div>
  );
};

function formatDate(timestamp) {
  if (!timestamp?.toDate) return 'Unknown date';
  return timestamp.toDate().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default BlogPost;
