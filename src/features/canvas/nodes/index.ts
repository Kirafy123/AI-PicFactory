import type { NodeTypes } from '@xyflow/react';

import { GroupNode } from './GroupNode';
import { ImageEditNode } from './ImageEditNode';
import { ImageNode } from './ImageNode';
import { StoryboardGenNode } from './StoryboardGenNode';
import { StoryboardNode } from './StoryboardNode';
import { TextAnnotationNode } from './TextAnnotationNode';
import { UploadNode } from './UploadNode';
import { Vr360Node } from './Vr360Node';
import { Director3dNode } from './director3d/Director3dNode';
import { VideoGenNode } from './VideoGenNode';
import { ExportVideoNode } from './ExportVideoNode';

export const nodeTypes: NodeTypes = {
  exportImageNode: ImageNode,
  groupNode: GroupNode,
  imageNode: ImageEditNode,
  storyboardGenNode: StoryboardGenNode,
  storyboardNode: StoryboardNode,
  textAnnotationNode: TextAnnotationNode,
  uploadNode: UploadNode,
  vr360Node: Vr360Node,
  director3dNode: Director3dNode,
  videoGenNode: VideoGenNode,
  exportVideoNode: ExportVideoNode,
};

export { GroupNode, ImageEditNode, ImageNode, StoryboardGenNode, StoryboardNode, TextAnnotationNode, UploadNode, Vr360Node, Director3dNode, VideoGenNode, ExportVideoNode };
