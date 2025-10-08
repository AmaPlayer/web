import { Post } from '../../../types/models';
import { User } from 'firebase/auth';

interface CommentForms {
  newComment: Record<string, string>;
}

export const handleCommentSubmission = async (
  postId: string,
  e: React.FormEvent,
  forms: CommentForms,
  currentUser: User | null,
  isGuest: () => boolean,
  navigate: (path: string) => void,
  trackBehavior: ((event: string, data: any) => void) | null,
  trackInteraction: (type: string, id: string, data: any) => void,
  posts: Post[],
  addComment: (postId: string, text: string, user: User, post: Post, isGuest: boolean) => Promise<void>,
  setNewComment: (postId: string, text: string) => void
): Promise<void> => {
  e.preventDefault();
  const commentText = forms.newComment[postId]?.trim();

  if (!commentText || !currentUser) return;

  if (isGuest()) {
    if (window.confirm('Please sign up or log in to comment on posts.\n\nWould you like to go to the login page?')) {
      navigate('/login');
    }
    return;
  }

  if (trackBehavior) {
    trackBehavior('post_comment', {
      userId: currentUser.uid,
      contentId: postId,
      contentType: 'comment',
      duration: commentText.length * 50
    });
  }

  trackInteraction('comment', postId, {
    postId,
    commentLength: commentText.length,
    userId: currentUser.uid
  });

  try {
    const post = posts.find(p => p.id === postId);
    if (!post) {
      throw new Error('Post not found');
    }
    await addComment(postId, commentText, currentUser, post, isGuest());
    setNewComment(postId, '');
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message);
    }
  }
};

export const handleCommentDeletion = async (
  postId: string,
  commentIndex: number,
  currentUser: User | null,
  posts: Post[],
  deleteComment: (postId: string, commentIndex: number, user: User, comments: any[]) => Promise<void>
): Promise<void> => {
  if (!currentUser) return;

  try {
    const post = posts.find(p => p.id === postId);
    if (!post?.comments) return;

    await deleteComment(postId, commentIndex, currentUser, post.comments);
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message);
    }
  }
};
