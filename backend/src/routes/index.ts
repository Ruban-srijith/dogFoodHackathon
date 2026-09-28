import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import eventRoutes from './event.routes';
import trackRoutes from './track.routes';
import teamRoutes from './team.routes';
import submissionRoutes from './submission.routes';
import judgeRoutes from './judge.routes';
import scoreRoutes from './score.routes';
import voteRoutes from './vote.routes';
import commentRoutes from './comment.routes';
import adminRoutes from './admin.routes';

const apiV1Router = Router();

apiV1Router.use('/auth', authRoutes);
apiV1Router.use('/users', userRoutes);
apiV1Router.use('/events', eventRoutes);
apiV1Router.use('/tracks', trackRoutes);
apiV1Router.use('/teams', teamRoutes);
apiV1Router.use('/submissions', submissionRoutes);
apiV1Router.use('/judges', judgeRoutes);
apiV1Router.use('/scores', scoreRoutes);
apiV1Router.use('/votes', voteRoutes);
apiV1Router.use('/comments', commentRoutes);
apiV1Router.use('/admin', adminRoutes);

export default apiV1Router;
