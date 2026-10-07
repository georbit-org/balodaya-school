export interface LeaderInfo {
  name: string;
  title: string;
  image: string;
  message: string;
  hashtag?: string;
}

export const LEADERSHIP_INFO = {
  chairman: {
    name: 'Toyanath Aryal',
    title: 'Founder & Chairman',
    image: '/assets/images/leadership/chairman.JPG',
    message:
      "Welcome to Balodaya Secondary School, where dreams take flight and futures are shaped. Rooted in a rich history, we're on a journey of inspiration and innovation. Embrace the possibilities, ignite your passion, and let's soar together towards a brighter future!",
    hashtag: '#BalodayaInspires #FutureLeaders',
  } satisfies LeaderInfo,
  principal: {
    name: 'Amrit Aryal',
    title: 'Principal',
    image: '/assets/images/leadership/amrit.jpeg',
    message:
      "Welcome to a place where dreams take flight and possibilities are endless! At Balodaya Secondary School, we're not just shaping minds; we're cultivating future leaders, innovators, and compassionate individuals. Each day is an opportunity for greatness, and together, we'll inspire, learn, and triumph. Embrace the journey, for at Balodaya, every student's potential is boundless.",
  } satisfies LeaderInfo,
  teamQuote: 'Unity is strength; together we stand, divided we fall.',
  teamImages: [
    '/assets/images/leadership/teachers_photo.jpg',
    '/assets/images/leadership/principal1.jpg',
  ],
};
