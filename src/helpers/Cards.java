package helpers;
import java.util.HashMap;
import java.util.Map;

import helpers.Card.Suit;

public class Cards {

    public static Map<String, Card> cards = new HashMap<String, Card>();
    
    public Cards() {
        Suit[] suits = new Suit[]{Suit.SPADES, Suit.CLUBS, Suit.DIAMONDS, Suit.HEARTS};

        int[] ranks = new int[]{2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14};

        
        for (int rank : ranks) {
            for (Suit suit : suits) {
                String name = "";
                switch(rank) {
                    case 11:
                        name = "J";
                        break;
                    case 12:
                        name = "Q";
                        break;
                    case 13:
                        name = "K";
                        break;
                    case 14:
                        name = "A";
                        break;
                    default:
                        name += String.valueOf(rank);

                }
                switch(suit) {
                    case SPADES:
                        name += 'S';
                        break;
                    case CLUBS:
                        name += 'C';
                        break;
                    case DIAMONDS:
                        name += 'D';
                        break;
                    case HEARTS:
                        name += 'H';
                        break;
                    default:
                        break;
                }

                cards.put(name, new Card(rank, suit));
            }
        }

        
    }
    public String toString() {
        String retval = "";
        for (Map.Entry<String, Card> entry : cards.entrySet()) {
            retval += entry.getKey() + "\n";
        }
        return retval;
    }
}
