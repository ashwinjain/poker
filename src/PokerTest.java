import static org.junit.Assert.assertEquals;

import java.util.ArrayList;
import java.util.Map;
import java.util.Random;

import org.junit.Test;

import helpers.Card;
import helpers.Cards;
import helpers.Hand;

public class PokerTest {

    @Test
    public void generateEveryHandTest() {

        final Cards CARDS = new Cards();
        final Map<String, Card> cards = CARDS.cards;

        Random generator = new Random();
        Object[] values = cards.values().toArray();

        ArrayList<Card> playerCards = new ArrayList<>();
        while (playerCards.size() < 7) {
            Card randomCard = (Card) values[generator.nextInt(values.length)];
            if (playerCards.contains(randomCard)) {
                continue;
            }
            playerCards.add(randomCard);

        }

        assertEquals(playerCards.size(), 7);
    }

}