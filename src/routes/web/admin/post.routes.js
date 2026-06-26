import { Router } from "express";
import * as PostController from "../../../controllers/web/admin/blog/post.controller.js";
import {
  validatePostCreate,
  validatePostUpdate,
  validatePostContent,
  validatePostSeo,
  validatePostStatus,
  validatePostId,
} from "../../../middlewares/validators/post.validator.js";
import { validateSearch } from "../../../middlewares/validators/search.validator.js";
import { csrfAfterMulter } from "../../../config/csrf.config.js";
import { processUpload } from "../../../config/multer.config.js";

const router = Router();

router.get("/", PostController.listPosts);

router.get("/detalji/:postId", validatePostId, PostController.postDetails);

router.get("/izmena/:postId", validatePostId, PostController.postDetails);

router.get("/novo", PostController.newPostForm);

router.get("/pretraga/:search", PostController.listPosts);

router.get("/:postId/sadrzaj", validatePostId, PostController.contentPage);

router.get("/:postId/seo", validatePostId, PostController.seoPage);

router.post(
  "/",
  ...processUpload("postImage", "posts"),
  csrfAfterMulter,
  validatePostCreate,
  PostController.createPost
);

router.post(
  '/:postId/upload-image',
  validatePostId,
  ...processUpload('contentImage', 'posts'),
  PostController.uploadContentImage
);

router.post(
  "/pretraga",
  validateSearch,
  PostController.searchRedirect
);

router.put(
  "/:postId/sadrzaj",
  validatePostId,
  validatePostContent,
  PostController.updateContent
);

router.put(
  "/:postId/seo",
  validatePostId,
  validatePostSeo,
  PostController.updateSeo
);

router.put(
  "/:postId",
  validatePostId,
  ...processUpload("postImage", "posts"),
  csrfAfterMulter,
  validatePostUpdate,
  PostController.updatePost
);

router.put(
  "/:postId/status",
  validatePostId,
  validatePostStatus,
  PostController.updateStatus
);

router.delete(
  "/:postId",
  validatePostId,
  PostController.deletePost
);

export default router;