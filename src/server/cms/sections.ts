import { z } from 'zod';

export const HeroSliderSectionSchema = z.object({
  use_system_slides: z.boolean().default(true),
  autoplay_speed_ms: z.number().default(6000),
  custom_slides: z
    .array(
      z.object({
        badge: z.string().optional(),
        title: z.string(),
        title_ne: z.string().optional(),
        subtitle: z.string().optional(),
        subtitle_ne: z.string().optional(),
        media_id: z.number().optional(),
        image_url: z.string(),
        primary_cta_text: z.string().optional(),
        primary_cta_link: z.string().optional(),
        secondary_cta_text: z.string().optional(),
        secondary_cta_link: z.string().optional(),
      })
    )
    .optional(),
});

export const RichTextSectionSchema = z.object({
  title: z.string().optional(),
  title_ne: z.string().optional(),
  content_en: z.string(),
  content_ne: z.string().optional(),
  alignment: z.enum(['left', 'center', 'right']).default('left'),
});

export const ImageTextSectionSchema = z.object({
  badge: z.string().optional(),
  title: z.string(),
  title_ne: z.string().optional(),
  subtitle_en: z.string().optional(),
  subtitle_ne: z.string().optional(),
  content_en: z.string(),
  content_ne: z.string().optional(),
  media_id: z.number().optional(),
  image_url: z.string(),
  image_alt: z.string().default('Photograph of Balodaya Secondary School'),
  image_position: z.enum(['left', 'right']).default('right'),
  cta_text: z.string().optional(),
  cta_link: z.string().optional(),
  secondary_cta_text: z.string().optional(),
  secondary_cta_link: z.string().optional(),
});

export const CardGridSectionSchema = z.object({
  title: z.string().optional(),
  title_ne: z.string().optional(),
  subtitle_en: z.string().optional(),
  subtitle_ne: z.string().optional(),
  columns: z.number().int().min(1).max(4).default(3),
  cards: z.array(
    z.object({
      title_en: z.string(),
      title_ne: z.string().optional(),
      description_en: z.string(),
      description_ne: z.string().optional(),
      icon: z.string().optional(),
      media_id: z.number().optional(),
      image_url: z.string().optional(),
      link: z.string().optional(),
      link_text: z.string().optional(),
      badge: z.string().optional(),
    })
  ),
});

export const StepsSectionSchema = z.object({
  title: z.string(),
  title_ne: z.string().optional(),
  subtitle_en: z.string().optional(),
  subtitle_ne: z.string().optional(),
  steps: z.array(
    z.object({
      step_number: z.string(),
      title_en: z.string(),
      title_ne: z.string().optional(),
      description_en: z.string(),
      description_ne: z.string().optional(),
      link: z.string().optional(),
    })
  ),
});

export const QuoteSectionSchema = z.object({
  quote_en: z.string(),
  quote_ne: z.string().optional(),
  author: z.string(),
  designation_en: z.string().optional(),
  designation_ne: z.string().optional(),
  media_id: z.number().optional(),
  avatar_url: z.string().optional(),
});

export const StatsRowSectionSchema = z.object({
  title: z.string().optional(),
  stats: z.array(
    z.object({
      label_en: z.string(),
      label_ne: z.string().optional(),
      value: z.string(),
      suffix: z.string().optional(),
      icon: z.string().optional(),
    })
  ),
});

export const NoticeListSectionSchema = z.object({
  title: z.string().default('Latest Notices & Circulars'),
  title_ne: z.string().optional(),
  count: z.number().int().min(1).max(20).default(4),
  category: z.string().default('all'),
  show_view_all: z.boolean().default(true),
});

export const NewsListSectionSchema = z.object({
  title: z.string().default('Campus News & Updates'),
  title_ne: z.string().optional(),
  count: z.number().int().min(1).max(12).default(3),
  show_view_all: z.boolean().default(true),
});

export const PhotoStripSectionSchema = z.object({
  title: z.string().optional(),
  images: z.array(
    z.object({
      media_id: z.number().optional(),
      image_url: z.string(),
      alt_text: z.string().default('Balodaya campus photograph'),
      caption: z.string().optional(),
    })
  ),
});

export const GalleryGridSectionSchema = z.object({
  title: z.string().default('School Photo Gallery'),
  title_ne: z.string().optional(),
  category: z.string().default('all'),
  count: z.number().int().min(1).max(48).default(12),
});

export const VideoSectionSchema = z.object({
  title: z.string().optional(),
  title_ne: z.string().optional(),
  video_url: z.string(),
  caption: z.string().optional(),
});

export const CtaBannerSectionSchema = z.object({
  title_en: z.string(),
  title_ne: z.string().optional(),
  subtitle_en: z.string().optional(),
  subtitle_ne: z.string().optional(),
  button_text_en: z.string(),
  button_text_ne: z.string().optional(),
  button_link: z.string(),
  secondary_button_text: z.string().optional(),
  secondary_button_link: z.string().optional(),
});

export const FaqSectionSchema = z.object({
  title_en: z.string().default('Frequently Asked Questions'),
  title_ne: z.string().optional(),
  items: z.array(
    z.object({
      question_en: z.string(),
      question_ne: z.string().optional(),
      answer_en: z.string(),
      answer_ne: z.string().optional(),
    })
  ),
});

export const StaffGridSectionSchema = z.object({
  title: z.string().default('Our Leadership & Faculty'),
  title_ne: z.string().optional(),
  department: z.string().default('all'),
});

export const HousesGridSectionSchema = z.object({
  title: z.string().default('School Houses'),
  title_ne: z.string().optional(),
  show_points: z.boolean().default(true),
});

export const DownloadsSectionSchema = z.object({
  title: z.string().default('Downloads & Resources'),
  title_ne: z.string().optional(),
  files: z.array(
    z.object({
      title_en: z.string(),
      title_ne: z.string().optional(),
      file_url: z.string(),
      media_id: z.number().optional(),
      file_size: z.string().optional(),
      category: z.string().optional(),
    })
  ),
});

export const ContactBlockSectionSchema = z.object({
  title: z.string().default('Get in Touch'),
  title_ne: z.string().optional(),
  show_form: z.boolean().default(true),
  show_map: z.boolean().default(true),
  show_hours: z.boolean().default(true),
});

export const MapEmbedSectionSchema = z.object({
  title: z.string().optional(),
  embed_url: z.string(),
  height_px: z.number().default(400),
});

export const SECTION_SCHEMAS: Record<string, z.ZodTypeAny> = {
  hero_slider: HeroSliderSectionSchema,
  rich_text: RichTextSectionSchema,
  image_text: ImageTextSectionSchema,
  card_grid: CardGridSectionSchema,
  steps: StepsSectionSchema,
  quote: QuoteSectionSchema,
  stats_row: StatsRowSectionSchema,
  notice_list: NoticeListSectionSchema,
  news_list: NewsListSectionSchema,
  photo_strip: PhotoStripSectionSchema,
  gallery_grid: GalleryGridSectionSchema,
  video: VideoSectionSchema,
  cta_banner: CtaBannerSectionSchema,
  faq: FaqSectionSchema,
  staff_grid: StaffGridSectionSchema,
  houses_grid: HousesGridSectionSchema,
  downloads: DownloadsSectionSchema,
  contact_block: ContactBlockSectionSchema,
  map_embed: MapEmbedSectionSchema,
};

export function validateSectionData(type: string, data: unknown) {
  const schema = SECTION_SCHEMAS[type];
  if (!schema) {
    // If unknown custom section, return data as is
    return data;
  }
  return schema.parse(data);
}
