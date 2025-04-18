import React, { useState, useEffect, useRef } from 'react';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  addDoc,
  collection,
  query,
  getDocs,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from './firebase';
import {
  Button,
  Card,
  Spinner,
  Alert,
  Badge,
  Container,
  Form,
  Row,
  Col,
  ProgressBar,
  Modal,
  InputGroup,
} from 'react-bootstrap';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FaArrowLeft,
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
  FaBookmark,
  FaRegBookmark,
  FaTwitter,
  FaFacebookF,
  FaLinkedinIn,
  FaRegClock,
  FaRegUser,
  FaTag,
  FaRegCalendarAlt,
  FaEye,
  FaPlus,
  FaSave,
  FaImage,
  FaTimes,
  FaTrash,
  FaPen,
  FaEnvelope,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeContext';
import { format } from 'date-fns';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './BlogPost.css';

// SEO Analyzer component for admin editor mode
const SeoAnalyzer = ({ title, content, excerpt, tags }) => {
  const [seoScore, setSeoScore] = useState(0);
  const [seoFeedback, setSeoFeedback] = useState([]);

  useEffect(() => {
    const analyzeSeo = () => {
      let score = 0;
      const feedback = [];

      // Title analysis
      const titleLength = title.length;
      if (titleLength > 0) {
        if (titleLength < 30) {
          feedback.push({
            type: 'warning',
            message: 'Title is too short. Aim for 50-60 characters.',
          });
          score += 5;
        } else if (titleLength >= 30 && titleLength <= 70) {
          feedback.push({ type: 'success', message: 'Title length is good.' });
          score += 15;
        } else {
          feedback.push({
            type: 'warning',
            message: 'Title is too long. Keep it under 70 characters.',
          });
          score += 5;
        }
      } else {
        feedback.push({ type: 'danger', message: 'Title is missing.' });
      }

      // Excerpt analysis
      const excerptLength = excerpt.length;
      if (excerptLength > 0) {
        if (excerptLength < 100) {
          feedback.push({
            type: 'warning',
            message:
              'Meta description is too short. Aim for 140-160 characters.',
          });
          score += 5;
        } else if (excerptLength >= 100 && excerptLength <= 160) {
          feedback.push({
            type: 'success',
            message: 'Meta description length is good.',
          });
          score += 15;
        } else {
          feedback.push({
            type: 'warning',
            message:
              'Meta description is too long. Keep it under 160 characters.',
          });
          score += 5;
        }
      } else {
        feedback.push({
          type: 'danger',
          message: 'Meta description is missing.',
        });
      }

      // Content analysis
      const strippedContent = content.replace(/<[^>]*>/g, '');
      const wordCount = strippedContent.split(/\s+/).filter(Boolean).length;

      if (wordCount < 300) {
        feedback.push({
          type: 'warning',
          message: `Content is ${wordCount} words. Aim for at least 300 words.`,
        });
        score += Math.min(15, wordCount / 20);
      } else if (wordCount >= 300 && wordCount < 600) {
        feedback.push({
          type: 'success',
          message: `Good content length: ${wordCount} words.`,
        });
        score += 15;
      } else {
        feedback.push({
          type: 'success',
          message: `Excellent content length: ${wordCount} words.`,
        });
        score += 20;
      }

      // Headers analysis
      const hasH2 = content.includes('<h2>') || content.includes('<h2 ');
      const hasH3 = content.includes('<h3>') || content.includes('<h3 ');

      if (hasH2 && hasH3) {
        feedback.push({
          type: 'success',
          message: 'Good use of headings (H2, H3) for structure.',
        });
        score += 15;
      } else if (hasH2 || hasH3) {
        feedback.push({
          type: 'warning',
          message:
            'Consider using more heading levels (H2, H3) for better structure.',
        });
        score += 7;
      } else {
        feedback.push({
          type: 'danger',
          message:
            'No headings found. Add H2 and H3 headings for better structure.',
        });
      }

      // Image analysis
      const hasImages = content.includes('<img');
      if (hasImages) {
        feedback.push({
          type: 'success',
          message: 'Good use of images in content.',
        });
        score += 10;
      } else {
        feedback.push({
          type: 'warning',
          message: 'No images found in content. Consider adding some.',
        });
      }

      // Links analysis
      const hasLinks = content.includes('<a href=');
      if (hasLinks) {
        feedback.push({
          type: 'success',
          message: 'Good use of internal/external links.',
        });
        score += 10;
      } else {
        feedback.push({
          type: 'warning',
          message:
            'No links found. Consider adding internal or external links.',
        });
      }

      // Keywords analysis
      if (tags.length > 0) {
        const keywords = tags.map((tag) => tag.toLowerCase());
        const titleLower = title.toLowerCase();
        const contentLower = strippedContent.toLowerCase();

        const keywordsInTitle = keywords.filter((keyword) =>
          titleLower.includes(keyword)
        );
        const keywordsInContent = keywords.filter((keyword) =>
          contentLower.includes(keyword)
        );

        if (keywordsInTitle.length > 0) {
          feedback.push({
            type: 'success',
            message: 'Keywords found in title.',
          });
          score += 10;
        } else {
          feedback.push({
            type: 'warning',
            message: 'Consider adding a main keyword to your title.',
          });
        }

        if (keywordsInContent.length > 0) {
          const keywordDensity =
            (keywordsInContent.reduce((acc, keyword) => {
              const regex = new RegExp(keyword, 'gi');
              const matches = contentLower.match(regex) || [];
              return acc + matches.length;
            }, 0) /
              wordCount) *
            100;

          if (keywordDensity > 0 && keywordDensity <= 2.5) {
            feedback.push({
              type: 'success',
              message: `Good keyword density: ${keywordDensity.toFixed(1)}%.`,
            });
            score += 10;
          } else if (keywordDensity > 2.5) {
            feedback.push({
              type: 'warning',
              message: `Keyword density (${keywordDensity.toFixed(1)}%) may be too high. Aim for 1-2.5%.`,
            });
            score += 5;
          }
        } else {
          feedback.push({
            type: 'danger',
            message: 'Keywords not found in content.',
          });
        }
      } else {
        feedback.push({ type: 'danger', message: 'No tags/keywords defined.' });
      }

      setSeoScore(Math.min(100, Math.round(score)));
      setSeoFeedback(feedback);
    };

    if (title || content || excerpt || tags.length > 0) {
      analyzeSeo();
    }
  }, [title, content, excerpt, tags]);

  const getSeoRating = () => {
    if (seoScore >= 80) return { text: 'Excellent', color: 'success' };
    if (seoScore >= 60) return { text: 'Good', color: 'primary' };
    if (seoScore >= 40) return { text: 'Fair', color: 'warning' };
    return { text: 'Poor', color: 'danger' };
  };

  const rating = getSeoRating();

  return (
    <div className="seo-analyzer mb-4">
      <h4 className="mb-3">SEO Analysis</h4>

      <div className="text-center mb-3">
        <div className="seo-score">
          <div
            className={`seo-score-circle text-${rating.color}`}
            style={{
              background: `conic-gradient(var(--bs-${rating.color}) ${seoScore}%, #e9ecef ${seoScore}%)`,
            }}
          >
            <span>{seoScore}</span>
          </div>
          <div className={`mt-2 text-${rating.color} fw-bold`}>
            {rating.text}
          </div>
        </div>
      </div>

      <div className="seo-feedback">
        {seoFeedback.map((item, index) => (
          <Alert key={index} variant={item.type} className="py-2">
            {item.message}
          </Alert>
        ))}
      </div>
    </div>
  );
};

const BlogPost = () => {
  const { theme } = useTheme();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // Editor-only states
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showBacklinkModal, setShowBacklinkModal] = useState(false);
  const [backlinkUrl, setBacklinkUrl] = useState('');
  const [backlinkText, setBacklinkText] = useState('');
  const [backlinks, setBacklinks] = useState([]);

  // Form states for editor
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [category, setCategory] = useState('tech');
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState([]);
  const [imageAlt, setImageAlt] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [featured, setFeatured] = useState(false);

  // Navigation and route parameters
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Debug information - helps diagnose URL/route issues
  console.log('ROUTE DEBUG - Full location:', location);
  console.log('ROUTE DEBUG - URL pathname:', location.pathname);
  console.log('ROUTE DEBUG - URL params:', params);

  // Extract ID and determine page mode
  const pathParts = location.pathname.split('/');
  console.log('ROUTE DEBUG - Path parts:', pathParts);

  // Determine page mode based on URL pattern
  let pageMode = '';
  let extractedId = '';

  if (pathParts.includes('new')) {
    pageMode = 'new';
    extractedId = 'new';
  } else if (pathParts.includes('edit')) {
    pageMode = 'edit';
    // Get the ID after 'edit'
    const editIndex = pathParts.indexOf('edit');
    if (editIndex >= 0 && editIndex < pathParts.length - 1) {
      extractedId = pathParts[editIndex + 1];
    }
  } else if (
    pathParts.includes('blog') &&
    pathParts.length > pathParts.indexOf('blog') + 1
  ) {
    pageMode = 'view';
    extractedId = pathParts[pathParts.indexOf('blog') + 1];
  }

  console.log('ROUTE DEBUG - Determined page mode:', pageMode);
  console.log('ROUTE DEBUG - Extracted ID:', extractedId);

  // Set correct flags based on page mode
  const isNewPost = pageMode === 'new';
  const isEditMode = pageMode === 'new' || pageMode === 'edit';
  const actualPostId = isNewPost ? null : extractedId;

  console.log('ROUTE DEBUG - Final values - isNewPost:', isNewPost);
  console.log('ROUTE DEBUG - Final values - isEditMode:', isEditMode);
  console.log('ROUTE DEBUG - Final values - actualPostId:', actualPostId);

  const quillRef = useRef(null);
  const fileInputRef = useRef(null);
  const contentRef = useRef(null);

  // Categories
  const categories = [
    { id: 'tech', name: 'Technology' },
    { id: 'cars', name: 'Automotive' },
    { id: 'reviews', name: 'Reviews' },
    { id: 'news', name: 'Industry News' },
    { id: 'maintenance', name: 'Maintenance Tips' },
  ];

  // Common tag suggestions for the editor
  const tagSuggestions = [
    'Electric Vehicles',
    'Classic Cars',
    'Car Care',
    'Technology',
    'Safety',
    'Performance',
    'Reviews',
    'Repair',
    'DIY',
    'Luxury',
  ];

  // Custom Quill modules and formats (for editor)
  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'video'],
        ['blockquote', 'code-block'],
        [{ align: [] }],
        ['clean'],
      ],
      handlers: {
        image: function () {
          handleImageUpload();
        },
      },
    },
    clipboard: {
      matchVisual: false, // Prevent unwanted paste behavior
    },
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'link',
    'image',
    'video',
    'blockquote',
    'code-block',
    'align',
  ];

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        console.log('Checking admin status...');
        const user = auth.currentUser;

        if (user) {
          console.log('Current user:', user.uid);

          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User data:', userData);

            // Check if user has admin role
            if (userData.role === 'admin') {
              console.log('Admin status confirmed');
              setIsAdmin(true);
            } else if (isEditMode) {
              console.log('Not an admin, redirecting');
              navigate('/blog');
            }
          }
        } else if (isEditMode) {
          console.log('No user logged in, redirecting');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, [isEditMode, navigate]);

  // Ensure the Quill editor is properly initialized
  useEffect(() => {
    // Ensure the Quill editor is available after render
    if (isEditMode && quillRef.current) {
      console.log('Quill editor initialized');
      const editor = quillRef.current.getEditor();

      // Force focus to update internal state
      if (editor) {
        setTimeout(() => {
          editor.focus();
          editor.blur();
        }, 100);
      }
    }
  }, [isEditMode]);

  // Set up scroll event for reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const windowHeight = window.innerHeight;
        const documentHeight =
          document.documentElement.scrollHeight - windowHeight;
        const scrollPosition = window.scrollY;

        if (documentHeight > 0) {
          const scrolled = Math.min(
            100,
            Math.max(0, (scrollPosition / documentHeight) * 100)
          );
          setReadingProgress(scrolled);
        }
      }
    };

    // Only add scroll listener for viewing posts, not for editing
    if (!isEditMode) {
      window.addEventListener('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isEditMode]);

  // Fetch post data
  useEffect(() => {
    const fetchPostData = async () => {
      console.log(
        'Fetching post data - isNewPost:',
        isNewPost,
        'actualPostId:',
        actualPostId
      );

      if (isNewPost) {
        // Initialize new post form for admin
        console.log('This is a new post');

        // Reset form fields
        setTitle('');
        setContent('');
        setExcerpt('');
        setImageUrl('');
        setCategory('tech');
        setTags([]);
        setImageAlt('');
        setImageCaption('');
        setMetaTitle('');
        setMetaDescription('');
        setFeatured(false);
        setBacklinks([]);
        setLoading(false);
      } else {
        // Fetch existing post data (for viewing or editing)
        try {
          // Check if actualPostId is valid for fetching
          if (!actualPostId) {
            console.error('Missing post ID');
            setError(
              'Post ID is missing. Please go back to the blog and select a post.'
            );
            setLoading(false);
            return;
          }

          console.log('Fetching existing post with id:', actualPostId);
          const postRef = doc(db, 'blogPosts', actualPostId);
          const postSnap = await getDoc(postRef);

          if (postSnap.exists()) {
            const postData = postSnap.data();
            setPost(postData);
            console.log('Post data fetched:', postData);

            // Update view count (only when viewing, not editing)
            if (!isEditMode) {
              setViews(postData.views || 0);
              setLikes(postData.likes || 0);

              // Check if post is liked by current user
              const user = auth.currentUser;
              if (
                user &&
                postData.likedBy &&
                postData.likedBy.includes(user.uid)
              ) {
                setIsLiked(true);
              }

              if (
                user &&
                postData.savedBy &&
                postData.savedBy.includes(user.uid)
              ) {
                setSaved(true);
              }

              // Update view count in database
              try {
                await updateDoc(postRef, {
                  views: increment(1),
                });
              } catch (err) {
                // Silent fail for view count update
                console.log('Could not update view count:', err);
              }

              // Fetch related posts
              fetchRelatedPosts(
                postData.tags || [],
                postData.category,
                actualPostId
              );
            }

            // For editing mode, populate form fields
            if (isEditMode) {
              console.log('Setting form fields for editing');
              setTitle(postData.title || '');
              setContent(postData.content || '');
              setExcerpt(postData.excerpt || '');
              setImageUrl(postData.image || '');
              setCategory(postData.category || 'tech');
              setTags(postData.tags || []);
              setImageAlt(postData.imageAlt || '');
              setImageCaption(postData.imageCaption || '');
              setMetaTitle(postData.metaTitle || postData.title || '');
              setMetaDescription(
                postData.metaDescription || postData.excerpt || ''
              );
              setFeatured(postData.featured || false);
              setBacklinks(postData.backlinks || []);
            }
          } else {
            setError('Post not found');
          }
        } catch (err) {
          console.error('Error loading post:', err);
          setError(`Error loading post: ${err.message}`);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPostData();
  }, [isNewPost, isEditMode, actualPostId]);

  // Fetch related posts based on tags and category
  const fetchRelatedPosts = async (tags, category, currentPostId) => {
    try {
      let relatedByTags = [];
      let relatedByCategory = [];

      // First try to find posts with matching tags
      if (tags && tags.length > 0) {
        try {
          const postsRef = collection(db, 'blogPosts');
          const postsSnap = await getDocs(postsRef);

          if (!postsSnap.empty) {
            postsSnap.forEach((doc) => {
              if (doc.id !== currentPostId) {
                const postData = doc.data();
                if (
                  postData.tags &&
                  postData.tags.some((tag) => tags.includes(tag))
                ) {
                  relatedByTags.push({
                    id: doc.id,
                    ...postData,
                  });
                }
              }
            });
          }
        } catch (e) {
          console.log('Error fetching posts by tags:', e);
        }

        if (relatedByTags.length >= 3) {
          setRelatedPosts(relatedByTags.slice(0, 3));
          return;
        }
      }

      // If not enough posts found by tags, try by category
      if (category) {
        try {
          const postsRef = collection(db, 'blogPosts');
          const postsSnap = await getDocs(postsRef);

          if (!postsSnap.empty) {
            postsSnap.forEach((doc) => {
              if (doc.id !== currentPostId) {
                const postData = doc.data();
                if (postData.category === category) {
                  relatedByCategory.push({
                    id: doc.id,
                    ...postData,
                  });
                }
              }
            });
          }
        } catch (e) {
          console.log('Error fetching posts by category:', e);
        }
      }

      const combined = [...relatedByTags, ...relatedByCategory]
        .filter(
          (post, index, self) =>
            index === self.findIndex((p) => p.id === post.id)
        )
        .slice(0, 3);

      setRelatedPosts(combined);
    } catch (error) {
      console.error('Error fetching related posts:', error);
    }
  };

  // Editor function: Handle image upload
  function handleImageUpload() {
    console.log('Image upload handler triggered');
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        try {
          console.log('File selected:', file.name);
          setUploading(true);

          // Create storage reference
          const storageRef = ref(
            storage,
            `blog_images/${Date.now()}_${file.name}`
          );

          // Upload file with progress monitoring
          const uploadTask = uploadBytesResumable(storageRef, file);

          uploadTask.on(
            'state_changed',
            (snapshot) => {
              // Track upload progress
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
              console.log('Upload progress:', progress);
            },
            (error) => {
              console.error('Error uploading image:', error);
              setUploading(false);
              alert('Failed to upload image. Please try again.');
            },
            async () => {
              // Upload complete
              console.log('Upload complete');
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('Download URL:', downloadURL);

              // Insert image into editor
              if (quillRef.current) {
                const quill = quillRef.current.getEditor();
                const range = quill.getSelection(true);

                // Insert image at cursor position
                quill.insertEmbed(range.index, 'image', downloadURL);

                // Move cursor after image
                quill.setSelection(range.index + 1);
                console.log('Image inserted into editor');
              } else {
                console.error('Quill editor reference is not available');
              }

              setUploading(false);
            }
          );
        } catch (error) {
          console.error('Error uploading image:', error);
          setUploading(false);
          alert('An error occurred. Please try again.');
        }
      }
    };
  }

  // Editor function: Handle featured image upload
  const handleFeaturedImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Editor function: Upload featured image to Firebase Storage
  const uploadFeaturedImage = async () => {
    if (!imageFile) return imageUrl; // Return existing URL if no new file

    try {
      setUploading(true);

      // Create storage reference
      const storageRef = ref(
        storage,
        `blog_featured/${Date.now()}_${imageFile.name}`
      );

      // Upload file with progress monitoring
      const uploadTask = uploadBytesResumable(storageRef, imageFile);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Track upload progress
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error('Error uploading image:', error);
            setUploading(false);
            reject(error);
          },
          async () => {
            // Upload complete
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setUploading(false);
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error('Error uploading featured image:', error);
      throw error;
    }
  };

  // Editor function: Add tag to the post
  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  // Editor function: Add suggested tag
  const addSuggestedTag = (tag) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  // Editor function: Remove tag from the post
  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Editor function: Add backlink to the content
  const addBacklink = () => {
    if (backlinkUrl && backlinkText) {
      const newBacklink = { url: backlinkUrl, text: backlinkText };
      setBacklinks([...backlinks, newBacklink]);

      // Insert backlink in editor
      if (quillRef.current) {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);

        if (range) {
          if (range.length > 0) {
            quill.deleteText(range.index, range.length);
          }

          // Insert link at cursor position
          quill.insertText(range.index, backlinkText, { link: backlinkUrl });
          quill.setSelection(range.index + backlinkText.length);
        }
      }

      // Clear modal fields
      setBacklinkUrl('');
      setBacklinkText('');
      setShowBacklinkModal(false);
    }
  };

  // Editor function: Remove backlink
  const removeBacklink = (index) => {
    const updatedBacklinks = [...backlinks];
    updatedBacklinks.splice(index, 1);
    setBacklinks(updatedBacklinks);
  };

  // Editor function: Save post to Firestore
  const handleSavePost = async () => {
    if (!title || !content) {
      alert('Please fill in the required fields: Title and Content');
      return;
    }

    try {
      setLoading(true);
      console.log('Saving post...');

      // Upload featured image if there's a new one
      let featuredImageUrl = imageUrl;
      if (imageFile) {
        console.log('Uploading new featured image');
        featuredImageUrl = await uploadFeaturedImage();
      }

      const currentUser = auth.currentUser;
      const userName =
        currentUser?.displayName || currentUser?.email || 'Mikutzu55';

      // Create post object
      const postData = {
        title,
        content,
        excerpt: excerpt || title.substring(0, 150),
        image: featuredImageUrl,
        category,
        tags,
        imageAlt: imageAlt || title,
        imageCaption,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt || title.substring(0, 150),
        featured,
        backlinks,
        author: userName,
        authorId: currentUser?.uid || 'anonymous',
        updatedAt: serverTimestamp(),
        reading_time: `${Math.ceil(
          content
            .replace(/<[^>]*>/g, '')
            .split(/\s+/)
            .filter(Boolean).length / 200
        )} min`,
      };

      console.log('Prepared post data:', postData);

      if (isNewPost) {
        // Create new post
        postData.createdAt = serverTimestamp();
        postData.views = 0;
        postData.likes = 0;

        console.log("Creating new post in collection 'blogPosts'");
        const docRef = await addDoc(collection(db, 'blogPosts'), postData);
        console.log('Post created with ID:', docRef.id);
        alert('Post created successfully!');
        navigate(`/blog/${docRef.id}`);
      } else {
        // Update existing post
        console.log('Updating existing post with ID:', actualPostId);
        await updateDoc(doc(db, 'blogPosts', actualPostId), postData);
        console.log('Post updated successfully');
        alert('Post updated successfully!');
        navigate(`/blog/${actualPostId}`);
      }
    } catch (error) {
      console.error('Error saving post:', error);
      setError(`Error saving post: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Editor function: Toggle preview mode
  const togglePreview = () => {
    setPreview(!preview);
  };

  // Post interaction function: Handle like
  const handleLike = async () => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    try {
      const postRef = doc(db, 'blogPosts', actualPostId);
      if (isLiked) {
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: arrayRemove(auth.currentUser.uid),
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

  // Post interaction function: Handle save
  const handleSave = async () => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      if (saved) {
        await updateDoc(userRef, {
          savedPosts: arrayRemove(actualPostId),
        });
      } else {
        await updateDoc(userRef, {
          savedPosts: arrayUnion(actualPostId),
        });
      }
      setSaved(!saved);
    } catch (err) {
      console.error('Error updating saved status:', err);
    }
  };

  // Post interaction function: Handle share
  const handleShare = (platform) => {
    const url = window.location.href;
    const title = post?.title || 'Check out this blog post';

    let shareUrl;

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      default:
        // Copy to clipboard
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  // Loading screen
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <Spinner
            animation="border"
            variant={theme === 'dark' ? 'light' : 'dark'}
          />
          <p className="mt-3">
            {isEditMode ? 'Loading editor...' : 'Loading post...'}
          </p>
        </div>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <Container className="py-5">
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
      </Container>
    );
  }

  // EDITOR MODE - For admins creating or editing posts
  if (isEditMode) {
    return (
      <Container fluid className="py-4">
        {/* Top action bar */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <Button
                variant="outline-primary"
                onClick={() => navigate('/blog')}
                className="d-flex align-items-center"
              >
                <FaArrowLeft className="me-2" />
                Back to Blog
              </Button>

              <div>
                <Button
                  variant="outline-secondary"
                  onClick={togglePreview}
                  className="me-2"
                >
                  {preview ? 'Edit' : 'Preview'}
                </Button>

                <Button
                  variant="primary"
                  onClick={handleSavePost}
                  disabled={uploading || loading}
                  className="d-flex align-items-center"
                >
                  <FaSave className="me-2" />
                  {isNewPost ? 'Publish Post' : 'Update Post'}
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Main editor content (left column) and settings (right column) */}
        <Row>
          {/* Left column - Editor or Preview */}
          <Col lg={8}>
            {preview ? (
              // Preview mode
              <Card className="glassmorphism-card mb-4">
                <Card.Body>
                  {imageUrl && (
                    <div className="featured-image-preview mb-4">
                      <img
                        src={imageUrl}
                        alt={imageAlt || title}
                        className="img-fluid rounded"
                      />
                      {imageCaption && (
                        <div className="image-caption text-muted mt-2 text-center">
                          {imageCaption}
                        </div>
                      )}
                    </div>
                  )}

                  <Badge bg="primary" className="mb-3">
                    {categories.find((cat) => cat.id === category)?.name ||
                      category}
                  </Badge>

                  <h1 className="mb-3">{title}</h1>

                  {excerpt && (
                    <div className="lead mb-4 fst-italic">{excerpt}</div>
                  )}

                  <div className="d-flex mb-4">
                    {tags.map((tag, index) => (
                      <Badge key={index} className="me-2" bg="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div
                    className="blog-content"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </Card.Body>
              </Card>
            ) : (
              // Edit mode
              <Card className="glassmorphism-card mb-4">
                <Card.Body>
                  <Form>
                    {/* Title */}
                    <Form.Group className="mb-4">
                      <Form.Label>Post Title*</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter post title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="form-control-lg"
                      />
                      <Form.Text className="text-muted">
                        {title.length} characters | Recommended: 50-60
                        characters for SEO
                      </Form.Text>
                    </Form.Group>

                    {/* Excerpt */}
                    <Form.Group className="mb-4">
                      <Form.Label>Excerpt / Meta Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Brief description of the post (appears in search results and social shares)"
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        className="form-control"
                      />
                      <Form.Text className="text-muted">
                        {excerpt.length} characters | Recommended: 140-160
                        characters for SEO
                      </Form.Text>
                    </Form.Group>

                    {/* Featured Image */}
                    <Form.Group className="mb-4">
                      <Form.Label>Featured Image</Form.Label>
                      <div className="d-flex align-items-center mb-3">
                        <Button
                          variant="outline-primary"
                          onClick={() => fileInputRef.current?.click()}
                          className="d-flex align-items-center"
                        >
                          <FaImage className="me-2" />
                          {imageUrl ? 'Change Image' : 'Upload Image'}
                        </Button>
                        <Form.Control
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFeaturedImageUpload}
                          accept="image/*"
                          style={{ display: 'none' }}
                        />
                      </div>

                      {imageUrl && (
                        <div className="featured-image-preview mb-3">
                          <div className="position-relative">
                            <img
                              src={imageUrl}
                              alt={imageAlt || 'Featured image preview'}
                              className="img-thumbnail"
                              style={{ maxHeight: '200px' }}
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              className="position-absolute top-0 end-0 m-1"
                              onClick={() => {
                                setImageUrl('');
                                setImageFile(null);
                                setImageAlt('');
                                setImageCaption('');
                              }}
                            >
                              <FaTimes />
                            </Button>
                          </div>
                        </div>
                      )}

                      {imageUrl && (
                        <>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              Alt Text (for accessibility and SEO)
                            </Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Describe what's in the image"
                              value={imageAlt}
                              onChange={(e) => setImageAlt(e.target.value)}
                            />
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label>Image Caption</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Optional caption for the image"
                              value={imageCaption}
                              onChange={(e) => setImageCaption(e.target.value)}
                            />
                          </Form.Group>
                        </>
                      )}
                    </Form.Group>

                    {/* Rich Text Editor */}
                    <Form.Group className="mb-4">
                      <Form.Label>Post Content*</Form.Label>
                      <div className="quill-container">
                        {/* Add key prop to force re-render and fix focus issues */}
                        <ReactQuill
                          ref={quillRef}
                          key="quill-editor"
                          value={content}
                          onChange={(value) => {
                            console.log(
                              'Editor content changed:',
                              value.substring(0, 30) + '...'
                            );
                            setContent(value);
                          }}
                          modules={modules}
                          formats={formats}
                          placeholder="Write your post content here..."
                          theme="snow"
                          style={{ height: '400px' }} // Add explicit height
                          preserveWhitespace={true} // Better handling of whitespace
                        />
                      </div>

                      {/* Upload progress */}
                      {uploading && (
                        <div className="mt-3">
                          <ProgressBar
                            now={uploadProgress}
                            label={`${Math.round(uploadProgress)}%`}
                          />
                        </div>
                      )}

                      {/* Word count */}
                      <Form.Text className="text-muted mt-2">
                        {content
                          ? content
                              .replace(/<[^>]*>/g, '')
                              .split(/\s+/)
                              .filter(Boolean).length
                          : 0}{' '}
                        words | Estimated reading time:{' '}
                        {content
                          ? Math.ceil(
                              content
                                .replace(/<[^>]*>/g, '')
                                .split(/\s+/)
                                .filter(Boolean).length / 200
                            )
                          : 0}{' '}
                        min
                      </Form.Text>
                    </Form.Group>
                  </Form>
                </Card.Body>
              </Card>
            )}
          </Col>

          {/* Right column - Settings and SEO */}
          <Col lg={4}>
            {!preview ? (
              // Edit mode sidebar
              <>
                {/* Post Settings */}
                <Card className="glassmorphism-card mb-4">
                  <Card.Header>
                    <h4 className="mb-0">Post Settings</h4>
                  </Card.Header>
                  <Card.Body>
                    {/* Category */}
                    <Form.Group className="mb-4">
                      <Form.Label>Category</Form.Label>
                      <Form.Select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    {/* Tags */}
                    <Form.Group className="mb-4">
                      <Form.Label>Tags</Form.Label>
                      <InputGroup className="mb-2">
                        <Form.Control
                          type="text"
                          placeholder="Add a tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                        />
                        <Button variant="outline-primary" onClick={addTag}>
                          <FaPlus />
                        </Button>
                      </InputGroup>

                      {/* Tag suggestions */}
                      <div className="mb-3">
                        <small className="text-muted">Suggestions: </small>
                        {tagSuggestions
                          .filter((tag) => !tags.includes(tag))
                          .slice(0, 5)
                          .map((tag, index) => (
                            <Badge
                              key={index}
                              bg="light"
                              text="dark"
                              className="me-2 mb-2 tag-suggestion"
                              onClick={() => addSuggestedTag(tag)}
                              style={{ cursor: 'pointer' }}
                            >
                              <FaPlus size={10} className="me-1" /> {tag}
                            </Badge>
                          ))}
                      </div>

                      <div className="selected-tags-container">
                        {tags.map((tag, index) => (
                          <Badge
                            key={index}
                            bg="secondary"
                            className="me-2 mb-2 selected-tag"
                          >
                            {tag}
                            <span
                              className="ms-1 tag-remove"
                              onClick={() => removeTag(tag)}
                            >
                              <FaTimes />
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </Form.Group>

                    {/* Featured Post Option */}
                    <Form.Group className="mb-4">
                      <Form.Check
                        type="switch"
                        id="featured-post-switch"
                        label="Featured Post (highlighted on blog homepage)"
                        checked={featured}
                        onChange={(e) => setFeatured(e.target.checked)}
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>

                {/* SEO Settings */}
                <Card className="glassmorphism-card mb-4">
                  <Card.Header>
                    <h4 className="mb-0">SEO Settings</h4>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-4">
                      <Form.Label>
                        SEO Title (Browser tab & search results)
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Custom SEO title (default: post title)"
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                      />
                      <Form.Text className="text-muted">
                        {metaTitle.length} characters | Recommended: 50-60
                        characters
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Meta Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Custom meta description (default: post excerpt)"
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                      />
                      <Form.Text className="text-muted">
                        {metaDescription.length} characters | Recommended:
                        140-160 characters
                      </Form.Text>
                    </Form.Group>
                  </Card.Body>
                </Card>

                {/* Backlinks */}
                <Card className="glassmorphism-card mb-4">
                  <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                      <h4 className="mb-0">Backlinks</h4>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setShowBacklinkModal(true)}
                      >
                        <FaPlus /> Add
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {backlinks.length > 0 ? (
                      <div className="backlinks-list">
                        {backlinks.map((link, index) => (
                          <div
                            key={index}
                            className="backlink-item d-flex justify-content-between align-items-center mb-2"
                          >
                            <div className="backlink-details">
                              <div className="backlink-text fw-bold">
                                {link.text}
                              </div>
                              <div
                                className="backlink-url small text-muted text-truncate"
                                style={{ maxWidth: '200px' }}
                              >
                                {link.url}
                              </div>
                            </div>
                            <Button
                              variant="link"
                              className="text-danger p-0"
                              onClick={() => removeBacklink(index)}
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted mb-0">No backlinks added yet.</p>
                    )}
                  </Card.Body>
                </Card>

                {/* SEO Analyzer */}
                <SeoAnalyzer
                  title={title}
                  content={content}
                  excerpt={excerpt || metaDescription}
                  tags={tags}
                />
              </>
            ) : (
              // Preview mode sidebar
              <>
                <Card className="glassmorphism-card mb-4">
                  <Card.Header>
                    <h4 className="mb-0">SEO Preview</h4>
                  </Card.Header>
                  <Card.Body>
                    {/* Google Search Preview */}
                    <div className="search-preview mb-4">
                      <h5 className="mb-3">Google Search Result</h5>
                      <div className="search-result-preview p-3 border rounded">
                        <div className="search-url text-success small mb-1">
                          {window.location.origin}/blog/
                          {actualPostId || 'post-title'}
                        </div>
                        <div className="search-title text-primary mb-1 fw-bold">
                          {metaTitle || title}
                        </div>
                        <div className="search-description small">
                          {metaDescription ||
                            excerpt ||
                            content.replace(/<[^>]*>/g, '').substring(0, 160) +
                              '...'}
                        </div>
                      </div>
                    </div>

                    {/* Social Media Preview */}
                    <div className="social-preview">
                      <h5 className="mb-3">Social Media Preview</h5>
                      <div className="social-card-preview border rounded overflow-hidden">
                        {imageUrl && (
                          <div className="social-image">
                            <img
                              src={imageUrl}
                              alt={imageAlt || title}
                              className="w-100"
                              style={{ maxHeight: '250px', objectFit: 'cover' }}
                            />
                          </div>
                        )}
                        <div className="social-content p-3">
                          <div className="social-meta text-muted small mb-1">
                            futurecar.blog
                          </div>
                          <div className="social-title fw-bold mb-2">
                            {metaTitle || title}
                          </div>
                          <div className="social-description small">
                            {metaDescription ||
                              excerpt ||
                              content
                                .replace(/<[^>]*>/g, '')
                                .substring(0, 160) + '...'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </>
            )}
          </Col>
        </Row>

        {/* Backlink Modal */}
        <Modal
          show={showBacklinkModal}
          onHide={() => setShowBacklinkModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Add Backlink</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>URL</Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://example.com"
                  value={backlinkUrl}
                  onChange={(e) => setBacklinkUrl(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Enter the full URL including https://
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Link Text</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Text that will be clickable"
                  value={backlinkText}
                  onChange={(e) => setBacklinkText(e.target.value)}
                />
                <Form.Text className="text-muted">
                  This text will appear as a clickable link in your content
                </Form.Text>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowBacklinkModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={addBacklink}
              disabled={!backlinkUrl || !backlinkText}
            >
              Add Link
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    );
  }

  // VIEW MODE - For all users to read blog posts
  if (!post) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Post not found. The post may have been removed or you might have
          followed an invalid link.
        </Alert>
        <Button
          variant="primary"
          onClick={() => navigate('/blog')}
          className="d-flex align-items-center mt-3"
        >
          <FaArrowLeft className="me-2" />
          Back to Blog
        </Button>
      </Container>
    );
  }

  // Format date for display
  const formattedDate = post.createdAt
    ? post.createdAt.seconds
      ? format(new Date(post.createdAt.seconds * 1000), 'yyyy-MM-dd')
      : format(new Date(post.createdAt), 'yyyy-MM-dd')
    : '2025-04-18';

  // Render the blog post for viewing
  return (
    <div className={`blog-post-container ${theme} py-3`} ref={contentRef}>
      {/* SEO Optimized Meta Tags */}
      <Helmet>
        <title>{post.metaTitle || post.title} | Future Car Blog</title>
        <meta
          name="description"
          content={
            post.metaDescription ||
            post.excerpt ||
            post.content?.substring(0, 160)
          }
        />
        {post.tags && <meta name="keywords" content={post.tags.join(', ')} />}
        <meta property="og:title" content={post.metaTitle || post.title} />
        <meta
          property="og:description"
          content={
            post.metaDescription ||
            post.excerpt ||
            post.content?.substring(0, 160)
          }
        />
        <meta property="og:image" content={post.image} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.metaTitle || post.title} />
        <meta
          name="twitter:description"
          content={
            post.metaDescription ||
            post.excerpt ||
            post.content?.substring(0, 160)
          }
        />
        <meta name="twitter:image" content={post.image} />
        <script type="application/ld+json">
          {`
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": "${post.title}",
            "image": "${post.image}",
            "datePublished": "${formattedDate}",
            "author": {
              "@type": "Person",
              "name": "${post.author}"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Future Car Blog",
              "logo": {
                "@type": "ImageObject",
                "url": "${window.location.origin}/logo.png"
              }
            },
            "description": "${post.excerpt || post.content?.substring(0, 160)}"
          }
          `}
        </script>
      </Helmet>

      {/* Reading Progress Bar */}
      <div className="reading-progress-container">
        <ProgressBar
          now={readingProgress}
          className="reading-progress-bar"
          style={{
            height: '4px',
            borderRadius: 0,
          }}
        />
      </div>

      <Container className="blog-post-content">
        {/* Back button and post metadata */}
        <div className="mb-4 d-flex justify-content-between align-items-center">
          <Button
            variant="outline-primary"
            onClick={() => navigate('/blog')}
            className="d-flex align-items-center back-button"
          >
            <FaArrowLeft className="me-2" />
            Back to Blog
          </Button>

          <div className="d-flex align-items-center post-meta-top">
            <span className="me-3">
              <FaEye className="me-1" /> {views} views
            </span>
            <span>
              <FaRegClock className="me-1" />{' '}
              {post.reading_time || '5 min read'}
            </span>
          </div>
        </div>

        {/* Hero section with featured image */}
        <div className="post-hero mb-5">
          {post.image && (
            <div className="post-image-container">
              <img
                src={post.image}
                alt={post.imageAlt || post.title}
                className="post-featured-image"
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  maxHeight: '500px',
                }}
              />
              {post.imageCaption && (
                <div className="image-caption text-muted mt-2 text-center fst-italic">
                  {post.imageCaption}
                </div>
              )}
            </div>
          )}

          {/* Category badges */}
          <div className="post-categories mt-4">
            <Badge
              className="category-badge me-2"
              bg={theme === 'dark' ? 'light' : 'dark'}
              text={theme === 'dark' ? 'dark' : 'light'}
            >
              {post.category}
            </Badge>
          </div>

          {/* Post title */}
          <h1 className="post-title my-3 display-3 fw-bold text-gradient">
            {post.title}
          </h1>

          {/* Post meta information */}
          <div className="post-meta d-flex flex-wrap align-items-center mb-4">
            <div className="author-info d-flex align-items-center me-4">
              <div className="author-avatar me-2">
                {post.authorImage ? (
                  <img
                    src={post.authorImage}
                    alt={post.author}
                    className="rounded-circle"
                    width="40"
                    height="40"
                  />
                ) : (
                  <div
                    className="author-avatar-placeholder rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: 'var(--accent-color)',
                    }}
                  >
                    <span>{post.author.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div>
                <span className="author-name fw-bold">{post.author}</span>
                <div className="post-date small text-muted">
                  <FaRegCalendarAlt className="me-1" /> {formattedDate}
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="post-tags mb-4">
              {post.tags.map((tag, index) => (
                <Badge
                  key={index}
                  className="me-2 mb-2 tag-badge"
                  style={{
                    backgroundColor: 'var(--accent-color)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                  }}
                >
                  <FaTag className="me-1" /> {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <Row>
          <Col lg={8} className="mb-5">
            <Card className="glassmorphism-card content-card">
              <Card.Body>
                {/* Post excerpt/intro */}
                {post.excerpt && (
                  <div className="post-excerpt mb-4 fs-5 fw-bold fst-italic">
                    {post.excerpt}
                  </div>
                )}

                {/* Article content */}
                <div
                  className="blog-content fs-5"
                  style={{ lineHeight: '1.8' }}
                  dangerouslySetInnerHTML={{
                    __html: post.content
                      .replace(/\n/g, '<br />')
                      .replace(/<img/g, '<img class="img-fluid rounded my-4"')
                      .replace(/<h2/g, '<h2 class="mt-5 mb-3"')
                      .replace(/<h3/g, '<h3 class="mt-4 mb-3"'),
                  }}
                />
              </Card.Body>
            </Card>

            {/* Actions bar */}
            <Card className="glassmorphism-card actions-card mt-4">
              <Card.Body>
                <div className="post-actions d-flex flex-wrap justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <Button
                      variant={isLiked ? 'primary' : 'outline-primary'}
                      onClick={handleLike}
                      className="d-flex align-items-center me-3"
                    >
                      {isLiked ? (
                        <FaHeart className="me-2" />
                      ) : (
                        <FaRegHeart className="me-2" />
                      )}
                      {likes} {likes === 1 ? 'Like' : 'Likes'}
                    </Button>

                    <Button
                      variant={saved ? 'primary' : 'outline-primary'}
                      onClick={handleSave}
                      className="d-flex align-items-center me-3"
                    >
                      {saved ? (
                        <FaBookmark className="me-2" />
                      ) : (
                        <FaRegBookmark className="me-2" />
                      )}
                      {saved ? 'Saved' : 'Save'}
                    </Button>

                    <div className="position-relative">
                      <Button
                        variant="outline-primary"
                        onClick={() => setShowShareOptions(!showShareOptions)}
                        className="d-flex align-items-center"
                      >
                        <FaShare className="me-2" />
                        Share
                      </Button>

                      {showShareOptions && (
                        <div
                          className="share-options"
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            zIndex: 1000,
                            backgroundColor:
                              theme === 'dark' ? '#2d3748' : '#ffffff',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            padding: '0.5rem',
                            marginTop: '0.5rem',
                          }}
                        >
                          <div className="d-flex">
                            <Button
                              variant="link"
                              className="share-btn twitter"
                              onClick={() => handleShare('twitter')}
                            >
                              <FaTwitter />
                            </Button>
                            <Button
                              variant="link"
                              className="share-btn facebook"
                              onClick={() => handleShare('facebook')}
                            >
                              <FaFacebookF />
                            </Button>
                            <Button
                              variant="link"
                              className="share-btn linkedin"
                              onClick={() => handleShare('linkedin')}
                            >
                              <FaLinkedinIn />
                            </Button>
                            <Button
                              variant="link"
                              className="share-btn copy"
                              onClick={() => handleShare('copy')}
                            >
                              <i className="fas fa-link"></i>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin edit button */}
                  {isAdmin && (
                    <Button
                      variant="outline-secondary"
                      onClick={() => navigate(`/blog/edit/${actualPostId}`)}
                      className="d-flex align-items-center"
                    >
                      <FaPen className="me-2" />
                      Edit Post
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Author bio */}
            <Card className="glassmorphism-card author-card mt-4">
              <Card.Body>
                <div className="d-flex flex-wrap align-items-center">
                  <div className="author-avatar me-3 mb-3 mb-md-0">
                    {post.authorImage ? (
                      <img
                        src={post.authorImage}
                        alt={post.author}
                        className="rounded-circle"
                        width="80"
                        height="80"
                      />
                    ) : (
                      <div
                        className="author-avatar-placeholder rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: 80,
                          height: 80,
                          backgroundColor: 'var(--accent-color)',
                        }}
                      >
                        <span className="fs-1">{post.author.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="author-bio">
                    <h4 className="mb-1">About {post.author}</h4>
                    <p className="mb-0">
                      {post.authorBio ||
                        `${post.author} writes about automotive trends, technologies, and insights.`}
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Sidebar */}
          <Col lg={4}>
            {/* Related posts */}
            <Card className="glassmorphism-card mb-4">
              <Card.Body>
                <h3 className="mb-4">Related Articles</h3>

                {relatedPosts.length > 0 ? (
                  relatedPosts.map((relatedPost, index) => (
                    <div
                      key={relatedPost.id}
                      className={`related-post-item ${index < relatedPosts.length - 1 ? 'mb-3 pb-3 border-bottom' : ''}`}
                      onClick={() => navigate(`/blog/${relatedPost.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex position-relative">
                        {/* Post thumbnail */}
                        <div className="related-post-image me-3">
                          <img
                            src={relatedPost.image}
                            alt={relatedPost.title}
                            style={{
                              width: '80px',
                              height: '60px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                            }}
                          />
                        </div>

                        {/* Post details */}
                        <div className="related-post-content">
                          <h5
                            className="related-post-title mb-1"
                            style={{ fontSize: '0.95rem' }}
                          >
                            {relatedPost.title}
                          </h5>
                          <div className="related-post-meta small text-muted">
                            <span className="me-2">
                              <FaRegCalendarAlt className="me-1" />
                              {relatedPost.createdAt
                                ? relatedPost.createdAt.seconds
                                  ? new Date(
                                      relatedPost.createdAt.seconds * 1000
                                    ).toLocaleDateString()
                                  : new Date(
                                      relatedPost.createdAt
                                    ).toLocaleDateString()
                                : '2025-04-18'}
                            </span>
                            <span>
                              <FaRegClock className="me-1" />
                              {relatedPost.reading_time || '5 min read'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No related articles found</p>
                )}

                <div className="text-center mt-3">
                  <Button
                    variant="outline-primary"
                    onClick={() => navigate('/blog')}
                    size="sm"
                  >
                    View All Articles
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Popular tags */}
            {post.tags && post.tags.length > 0 && (
              <Card className="glassmorphism-card mb-4">
                <Card.Body>
                  <h3 className="mb-3">Explore Tags</h3>
                  <div className="d-flex flex-wrap">
                    {post.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        onClick={() => navigate(`/blog?tag=${tag}`)}
                        className="me-2 mb-2 tag-badge"
                        style={{
                          backgroundColor: 'var(--accent-color)',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          cursor: 'pointer',
                        }}
                      >
                        <FaTag className="me-1" /> {tag}
                      </Badge>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Newsletter signup - Enhanced version */}
            <Card className="glassmorphism-card newsletter-card mb-4">
              <Card.Body>
                <div className="email-animation">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M0 0h24v24H0V0z" fill="none" />
                    <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" />
                  </svg>
                </div>
                <h3>Stay Updated</h3>
                <p>
                  Join our community and receive the latest automotive insights,
                  exclusive content, and special offers directly to your inbox.
                </p>

                <form className="newsletter-form">
                  <div className="email-input-container mb-3">
                    <i className="fas fa-envelope"></i>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Your email address"
                      required
                    />
                  </div>
                  <div className="d-grid">
                    <Button
                      variant="primary"
                      type="submit"
                      className="btn-subscribe"
                    >
                      Subscribe Now
                    </Button>
                  </div>
                  <p
                    className="mt-2 text-center"
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--muted-text-color)',
                    }}
                  >
                    By subscribing, you agree to our{' '}
                    <a href="#">Privacy Policy</a>. We won't spam, promise!
                  </p>
                </form>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* More from this category - Full width section */}
        <div className="more-from-category mt-5">
          <h2 className="section-title mb-4">
            More from{' '}
            <span className="text-gradient">
              {categories.find((cat) => cat.id === post.category)?.name ||
                post.category}
            </span>
          </h2>

          <Row>
            {relatedPosts.slice(0, 3).map((relatedPost) => (
              <Col md={4} key={relatedPost.id} className="mb-4">
                <Card
                  className="glassmorphism-card h-100 hover-zoom"
                  onClick={() => navigate(`/blog/${relatedPost.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-img-container">
                    <Card.Img
                      variant="top"
                      src={relatedPost.image}
                      alt={relatedPost.title}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  </div>
                  <Card.Body>
                    <div className="card-meta small text-muted mb-2">
                      <span className="me-2">
                        <FaRegCalendarAlt className="me-1" />
                        {relatedPost.createdAt
                          ? relatedPost.createdAt.seconds
                            ? new Date(
                                relatedPost.createdAt.seconds * 1000
                              ).toLocaleDateString()
                            : new Date(
                                relatedPost.createdAt
                              ).toLocaleDateString()
                          : '2025-04-18'}
                      </span>
                    </div>
                    <Card.Title>{relatedPost.title}</Card.Title>
                    <Card.Text className="text-truncate">
                      {relatedPost.excerpt ||
                        relatedPost.content
                          ?.replace(/<[^>]*>/g, '')
                          .substring(0, 120) + '...'}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Container>
    </div>
  );
};

export default BlogPost;

