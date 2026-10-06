export default async function getYouTubeDetail(youTubeId: string) {
  // sample is mEJ8f0-rACo

  async function getIt() {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return [
      {
        id: youTubeId,
        snippet: {
          publishedAt: "2018-11-01T04:19:09Z",
          channelId: "UCl_fhwlTAARASHq2hoEd_pw",
          title: "Gayle Laakmann McDowell Talks about 'Interview Like Google (or not)-But Better!'",
          description:
            "Gayle Laakmann McDowell Talks about 'Interview Like Google (or not)-But Better!' at https://SiliconValley-CodeCamp.com in San Jose Hosted by PayPal\n\nBe a better interviewer: make candidates happier, raise the bar, create a consistent process, and avoid rejecting good candidates or hiring bad ones. We'll discuss multiple interview styles so you can interview like Google (or not)-but better!\n\n\nSession Details:\nhttps://SiliconValley-CodeCamp.com/Session/2018/interview-like-google-or-not-but-better\nSession Materials:\nhttp://go.gayle.com/interviewinglikegoogle\n\n\nSilicon Valley Code Camp site:\nhttps://SiliconValley-CodeCamp.com\n\nSubscribe to the Silicon Valley Code Camp Youtube Channel\nhttps://www.youtube.com/c/SiliconValleyCodeCampVideos\n\nFollow Silicon Valley Code Camp on Twitter: https://twitter.com/sv_code_camp\nJoin the Silicon Valley Code Camp G+ community: https://plus.google.com/110656351842726857531\nInterview Like Google (or not)-But Better! at Silicon Valley Code Camp 2018 \n\n\n\nFollow Gayle Laakmann McDowell on Twitter: https://twitter.com/gayle\n\nSpeaker Biography for Gayle Laakmann McDowell\n\nGayle Laakmann McDowell is the founder and CEO of CareerCup.com and the author of three books.\n\nGayle has worked as a Software Engineer for Google, Microsoft and Apple. She holds a BSE and MSE from UPenn in Computer Science, and an MBA from the Wharton School.",
          thumbnails: {
            medium: {
              url: "https://i.ytimg.com/vi/mEJ8f0-rACo/mqdefault.jpg",
              width: 320,
              height: 180,
            },
          },
          channelTitle: "Silicon Valley Code Camp",
          defaultAudioLanguage: "en",
        },
        contentDetails: {
          duration: "PT1H16M2S",
          dimension: "2d",
          definition: "hd",
          caption: "false",
          licensedContent: true,
          contentRating: {},
          projection: "rectangular",
        },
        statistics: {
          viewCount: "2484",
          likeCount: "45",
          favoriteCount: "0",
          commentCount: "0",
        },
      },
    ];
  }

  const str = getIt();
  return str;
}
