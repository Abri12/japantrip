export interface ClothingAdvice {
  emoji: string;
  title: string;
  tips: string[];
}

/**
 * 체감온도 기준 옷차림.
 *
 * 실제 기온이 아니라 **체감온도**로 구간을 나눈다. 오사카 여름은 기온 28도에
 * 습도 76%면 체감 33도를 넘는 일이 흔한데, 기온만 보고 옷을 고르면 여행 내내
 * 덥게 다니게 된다.
 */
export function clothingAdvice(feelsLikeC: number, humidity: number): ClothingAdvice {
  if (feelsLikeC >= 33) {
    return {
      emoji: '🥵',
      title: '반팔에 얇은 옷 하나로 충분해요',
      tips: [
        '통풍 잘 되는 얇은 옷을 입으세요. 실내 냉방이 강한 곳이 많아 얇은 겉옷 하나는 챙겨두면 좋아요',
        humidity >= 70
          ? '습도가 높아 땀이 잘 안 말라요. 여벌 옷이나 손수건이 유용해요'
          : '건조한 더위예요. 물을 자주 드세요',
      ],
    };
  }
  if (feelsLikeC >= 27) {
    return {
      emoji: '☀️',
      title: '반팔이면 충분하고, 햇빛 대비는 챙기세요',
      tips: ['햇빛이 강하면 양산이나 모자가 도움이 돼요', '실내는 시원할 수 있어 얇은 겉옷 하나 정도만 챙기세요'],
    };
  }
  if (feelsLikeC >= 20) {
    return {
      emoji: '🧥',
      title: '얇은 긴팔에 카디건을 챙기세요',
      tips: ['아침저녁으로 선선할 수 있어요. 벗고 입기 쉬운 얇은 겉옷이 좋아요'],
    };
  }
  if (feelsLikeC >= 12) {
    return {
      emoji: '🧣',
      title: '가벼운 자켓이나 니트가 필요해요',
      tips: ['아침저녁으로 꽤 쌀쌀해요. 목이 시리면 스카프도 도움이 돼요'],
    };
  }
  return {
    emoji: '🧤',
    title: '두꺼운 겉옷을 챙기세요',
    tips: ['실내외 온도차가 커요. 여러 겹 겹쳐 입으면 조절하기 편해요'],
  };
}

